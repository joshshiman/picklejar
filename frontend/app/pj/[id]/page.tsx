'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface PickleJar {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface Member {
  id: string;
  display_name: string;
  has_suggested: boolean;
  has_voted: boolean;
}

export default function PickleJarPage() {
  const params = useParams();
  const id = params.id as string;
  const [picklejar, setPicklejar] = useState<PickleJar | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [phone, setPhone] = useState('');
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchPicklejar = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`);
          setPicklejar(res.data);
        } catch (error) {
          console.error('Failed to fetch PickleJar:', error);
        }
      };
      const fetchMembers = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/members`);
          setMembers(res.data);
        } catch (error) {
          console.error('Failed to fetch members:', error);
        }
      };
      fetchPicklejar();
      fetchMembers();
    }
  }, [id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/join`, { phone_number: phone });
      setIsMember(true);
      // Refetch members
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/members`);
      setMembers(res.data);
    } catch (error) {
      console.error('Failed to join:', error);
    }
  };

  if (!picklejar) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">{picklejar.title}</h1>
      <p className="text-lg mb-4">{picklejar.description}</p>
      <p className="text-md mb-4">Status: <span className="font-semibold">{picklejar.status}</span></p>

      {!isMember ? (
        <form onSubmit={handleJoin} className="mb-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number to join"
            className="border p-2 rounded mr-2"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Join
          </button>
        </form>
      ) : (
        <div>
          <p className="text-green-500 font-bold mb-4">You have joined this PickleJar!</p>
          <div className="flex space-x-4">
            <Link href={`/pj/${id}/suggest`} className="bg-green-500 text-white p-2 rounded">
              Make a Suggestion
            </Link>
            <Link href={`/pj/${id}/vote`} className="bg-yellow-500 text-white p-2 rounded">
              Vote on Suggestions
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">Members ({members.length})</h2>
        <ul>
          {members.map((member) => (
            <li key={member.id} className="flex justify-between items-center p-2 border-b">
              <span>{member.display_name || 'Anonymous'}</span>
              <div className="flex space-x-2">
                <span className={member.has_suggested ? 'text-green-500' : 'text-gray-400'}>Suggested</span>
                <span className={member.has_voted ? 'text-green-500' : 'text-gray-400'}>Voted</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
       <div className="mt-8">
          <Link href={`/pj/${id}/results`} className="bg-purple-500 text-white p-2 rounded">
              View Results
          </Link>
        </div>
    </div>
  );
}
