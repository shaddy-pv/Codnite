import { Router } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all chat rooms
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const { type, college_id } = req.query;
    const userId = req.user?.userId;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      whereClause += ` WHERE cr.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (college_id) {
      whereClause += whereClause ? ` AND cr.college_id = $${paramIndex}` : ` WHERE cr.college_id = $${paramIndex}`;
      params.push(college_id);
      paramIndex++;
    }

    const rooms = await query(`
      SELECT 
        cr.id, cr.name, cr.description, cr.type, cr.college_id, cr.created_at,
        c.name as college_name, c.short_name as college_short_name,
        u.username as created_by_username, u.name as created_by_name,
        (SELECT COUNT(*) FROM chat_room_members crm WHERE crm.room_id = cr.id) as member_count,
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id) as message_count,
        CASE WHEN EXISTS(
          SELECT 1 FROM chat_room_members crm 
          WHERE crm.room_id = cr.id AND crm.user_id = $${paramIndex}
        ) THEN true ELSE false END as is_member
      FROM chat_rooms cr
      LEFT JOIN colleges c ON cr.college_id = c.id
      LEFT JOIN users u ON cr.created_by = u.id
      ${whereClause}
      ORDER BY cr.created_at DESC
    `, [...params, userId]);

    res.json(rooms.rows);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Create a new chat room
router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, description, type = 'public', college_id } = req.body;
    const userId = req.user?.userId;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const room = await query(`
      INSERT INTO chat_rooms (name, description, type, college_id, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, type, college_id, created_at
    `, [name, description, type, college_id, userId]);

    // Add creator as admin member
    await query(`
      INSERT INTO chat_room_members (room_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `, [room.rows[0].id, userId]);

    res.status(201).json(room.rows[0]);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// Join a chat room
router.post('/rooms/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;

    // Check if room exists
    const room = await query('SELECT id, type FROM chat_rooms WHERE id = $1', [roomId]);
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Check if already a member
    const existingMember = await query(`
      SELECT id FROM chat_room_members WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    // Add user to room
    await query(`
      INSERT INTO chat_room_members (room_id, user_id, role)
      VALUES ($1, $2, 'member')
    `, [roomId, userId]);

    res.json({ message: 'Successfully joined chat room' });
  } catch (error) {
    console.error('Error joining chat room:', error);
    res.status(500).json({ error: 'Failed to join chat room' });
  }
});

// Leave a chat room
router.post('/rooms/:roomId/leave', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;

    await query(`
      DELETE FROM chat_room_members WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    res.json({ message: 'Successfully left chat room' });
  } catch (error) {
    console.error('Error leaving chat room:', error);
    res.status(500).json({ error: 'Failed to leave chat room' });
  }
});

// Get chat room messages
router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user?.userId;

    // Check if user is member of the room
    const membership = await query(`
      SELECT id FROM chat_room_members WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this chat room' });
    }

    const messages = await query(`
      SELECT 
        cm.id, cm.content, cm.message_type, cm.metadata, cm.created_at,
        u.id as sender_id, u.username as sender_username, u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [roomId, limit, offset]);

    res.json(messages.rows.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send a message to chat room
router.post('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, message_type = 'text', metadata = {} } = req.body;
    const userId = req.user?.userId;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if user is member of the room
    const membership = await query(`
      SELECT id FROM chat_room_members WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this chat room' });
    }

    const message = await query(`
      INSERT INTO chat_messages (room_id, sender_id, content, message_type, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, content, message_type, metadata, created_at
    `, [roomId, userId, content, message_type, JSON.stringify(metadata)]);

    // Get sender info
    const sender = await query(`
      SELECT id, username, name, avatar_url FROM users WHERE id = $1
    `, [userId]);

    const response = {
      ...message.rows[0],
      sender_id: sender.rows[0].id,
      sender_username: sender.rows[0].username,
      sender_name: sender.rows[0].name,
      sender_avatar: sender.rows[0].avatar_url
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get chat room members
router.get('/rooms/:roomId/members', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;

    // Check if user is member of the room
    const membership = await query(`
      SELECT id FROM chat_room_members WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this chat room' });
    }

    const members = await query(`
      SELECT 
        u.id, u.username, u.name, u.avatar_url, u.college_id,
        c.name as college_name, c.short_name as college_short_name,
        crm.role, crm.joined_at
      FROM chat_room_members crm
      JOIN users u ON crm.user_id = u.id
      LEFT JOIN colleges c ON u.college_id = c.id
      WHERE crm.room_id = $1
      ORDER BY crm.joined_at ASC
    `, [roomId]);

    res.json(members.rows);
  } catch (error) {
    console.error('Error fetching chat room members:', error);
    res.status(500).json({ error: 'Failed to fetch chat room members' });
  }
});

// Direct messaging endpoints

// Send a direct message
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user?.userId;

    console.log('Chat message request:', { receiverId, content, senderId, user: req.user });

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    if (!senderId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Check if receiver exists
    const receiver = await query('SELECT id FROM users WHERE id = $1', [receiverId]);
    if (receiver.rows.length === 0) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Create direct message
    const message = await query(`
      INSERT INTO direct_messages (sender_id, receiver_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, sender_id, receiver_id, created_at as createdAt, read
    `, [senderId, receiverId, content]);

    const response = {
      message: message.rows[0],
      success: true
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error sending direct message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages with a specific user
router.get('/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;
    const { page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const messages = await query(`
      SELECT 
        dm.id, dm.content, dm.sender_id, dm.receiver_id, dm.created_at as createdAt, dm.read,
        u1.name as sender_name, u1.username as sender_username, u1.avatar_url as sender_avatar,
        u2.name as receiver_name, u2.username as receiver_username, u2.avatar_url as receiver_avatar
      FROM direct_messages dm
      JOIN users u1 ON dm.sender_id = u1.id
      JOIN users u2 ON dm.receiver_id = u2.id
      WHERE (dm.sender_id = $1 AND dm.receiver_id = $2) 
         OR (dm.sender_id = $2 AND dm.receiver_id = $1)
      ORDER BY dm.created_at ASC
      LIMIT $3 OFFSET $4
    `, [currentUserId, userId, limit, offset]);

    // Mark messages as read
    await query(`
      UPDATE direct_messages 
      SET read = true 
      WHERE receiver_id = $1 AND sender_id = $2 AND read = false
    `, [currentUserId, userId]);

    res.json({ messages: messages.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all conversations (users you've messaged)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user?.userId;

    const conversations = await query(`
      SELECT DISTINCT
        CASE 
          WHEN dm.sender_id = $1 THEN dm.receiver_id
          ELSE dm.sender_id
        END as user_id,
        CASE 
          WHEN dm.sender_id = $1 THEN u2.name
          ELSE u1.name
        END as user_name,
        CASE 
          WHEN dm.sender_id = $1 THEN u2.username
          ELSE u1.username
        END as user_username,
        CASE 
          WHEN dm.sender_id = $1 THEN u2.avatar_url
          ELSE u1.avatar_url
        END as user_avatar,
        dm.content as last_message,
        dm.created_at as last_message_time,
        CASE 
          WHEN dm.sender_id = $1 THEN false
          ELSE NOT dm.read
        END as has_unread
      FROM direct_messages dm
      JOIN users u1 ON dm.sender_id = u1.id
      JOIN users u2 ON dm.receiver_id = u2.id
      WHERE dm.id IN (
        SELECT MAX(id) 
        FROM direct_messages 
        WHERE sender_id = $1 OR receiver_id = $1
        GROUP BY CASE 
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
        END
      )
      ORDER BY last_message_time DESC
    `, [currentUserId]);

    res.json({ conversations: conversations.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
