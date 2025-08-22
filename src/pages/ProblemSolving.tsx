import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCircle, XCircle, MessageSquare, ThumbsUp, Save, Share2, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
const ProblemSolving: React.FC = () => {
  const {
    problemId
  } = useParams<{
    problemId: string;
  }>();
  const [activeTab, setActiveTab] = useState('description');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`);
  // Mock problem data
  const problem = {
    id: problemId,
    title: 'Two Sum',
    difficulty: 'Easy',
    acceptanceRate: '47%',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [{
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
    }, {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
      explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
    }, {
      input: 'nums = [3,3], target = 6',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
    }],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    tags: ['Array', 'Hash Table'],
    companies: ['Amazon', 'Google', 'Facebook', 'Microsoft'],
    submissions: {
      total: 12458,
      accepted: 5845,
      rate: '47%'
    }
  };
  const discussions = [{
    id: 1,
    author: {
      name: 'Alex Johnson',
      username: 'alexj',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    content: 'This is a classic problem that can be solved in O(n) time using a hash map. The key insight is to check if the complement (target - current number) exists in the map as we iterate through the array.',
    likes: 42,
    time: '2 days ago',
    replies: 5
  }, {
    id: 2,
    author: {
      name: 'Sophia Chen',
      username: 'sophiac',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    content: 'You can also solve this with a brute force approach using two nested loops, but that would be O(n²) time complexity. The hash map approach is much more efficient.',
    likes: 28,
    time: '1 day ago',
    replies: 2
  }];
  return <div className="max-w-screen-xl mx-auto">
      {/* Problem header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-3">{problem.title}</h1>
            <Badge text={problem.difficulty} color={problem.difficulty === 'Easy' ? 'blue' : problem.difficulty === 'Medium' ? 'purple' : 'cyan'} />
          </div>
          <div className="flex items-center text-dark-300 text-sm mt-1">
            <span>Acceptance: {problem.acceptanceRate}</span>
            <span className="mx-2">•</span>
            <span>Submissions: {problem.submissions.total}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Previous
          </Button>
          <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Next
          </Button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel - Problem description */}
        <div className="lg:w-1/2">
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="flex border-b border-dark-500">
              <button onClick={() => setActiveTab('description')} className={`flex-1 py-3 px-4 text-center transition-colors ${activeTab === 'description' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
                Description
              </button>
              <button onClick={() => setActiveTab('discussion')} className={`flex-1 py-3 px-4 text-center transition-colors ${activeTab === 'discussion' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
                Discussion
              </button>
              <button onClick={() => setActiveTab('solutions')} className={`flex-1 py-3 px-4 text-center transition-colors ${activeTab === 'solutions' ? 'border-b-2 border-primary-blue text-primary-blue' : 'text-dark-300 hover:text-dark-100'}`}>
                Solutions
              </button>
            </div>
            <div className="p-6">
              {activeTab === 'description' && <div className="space-y-6">
                  <div>
                    <p className="whitespace-pre-line">{problem.description}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Examples:</h3>
                    <div className="space-y-4">
                      {problem.examples.map((example, index) => <div key={index} className="bg-dark-700 rounded-md p-3">
                          <div className="mb-1">
                            <span className="text-dark-300">Input: </span>
                            <span className="font-mono">{example.input}</span>
                          </div>
                          <div className="mb-1">
                            <span className="text-dark-300">Output: </span>
                            <span className="font-mono">{example.output}</span>
                          </div>
                          {example.explanation && <div>
                              <span className="text-dark-300">
                                Explanation:{' '}
                              </span>
                              <span>{example.explanation}</span>
                            </div>}
                        </div>)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Constraints:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {problem.constraints.map((constraint, index) => <li key={index} className="font-mono text-sm">
                          {constraint}
                        </li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Companies:</h3>
                    <div className="flex flex-wrap gap-2">
                      {problem.companies.map((company, index) => <Badge key={index} text={company} color="gray" />)}
                    </div>
                  </div>
                </div>}
              {activeTab === 'discussion' && <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">
                      Discussion ({discussions.length})
                    </h3>
                    <Button variant="outline" size="sm">
                      New Post
                    </Button>
                  </div>
                  {discussions.map(discussion => <div key={discussion.id} className="border-b border-dark-500 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start">
                        <Avatar src={discussion.author.avatar} size="sm" />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <span className="font-medium">
                                {discussion.author.name}
                              </span>
                              <span className="text-dark-300 text-sm ml-2">
                                @{discussion.author.username}
                              </span>
                            </div>
                            <span className="text-dark-300 text-sm">
                              {discussion.time}
                            </span>
                          </div>
                          <p className="mt-2">{discussion.content}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <button className="flex items-center text-dark-300 hover:text-primary-blue transition-colors">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {discussion.likes}
                              </span>
                            </button>
                            <button className="flex items-center text-dark-300 hover:text-primary-blue transition-colors">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {discussion.replies}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>)}
                </div>}
              {activeTab === 'solutions' && <div>
                  <p className="text-center text-dark-300">
                    Submit your solution first to view other solutions.
                  </p>
                </div>}
            </div>
          </div>
        </div>
        {/* Right panel - Code editor */}
        <div className="lg:w-1/2">
          <div className="bg-dark-600 rounded-xl border border-dark-500 overflow-hidden">
            <div className="flex justify-between items-center border-b border-dark-500 p-2">
              <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="bg-dark-700 border border-dark-500 rounded px-2 py-1 text-sm">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" leftIcon={<Save className="h-4 w-4" />}>
                  Save
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Play className="h-4 w-4" />}>
                  Run
                </Button>
                <Button variant="primary" size="sm" leftIcon={<CheckCircle className="h-4 w-4" />}>
                  Submit
                </Button>
              </div>
            </div>
            <div className="p-4 h-[600px] flex flex-col">
              <div className="flex-1 bg-dark-700 rounded-md p-4 font-mono text-sm overflow-auto">
                <textarea value={code} onChange={e => setCode(e.target.value)} className="w-full h-full bg-transparent outline-none resize-none" spellCheck="false" />
              </div>
              <div className="mt-4 bg-dark-700 rounded-md p-4">
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center mr-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="font-medium text-green-500">Accepted</span>
                  <div className="ml-auto flex items-center text-dark-300 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Runtime: 76 ms (faster than 92%)</span>
                    <span className="mx-2">•</span>
                    <span>Memory: 42.1 MB (better than 87%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default ProblemSolving;