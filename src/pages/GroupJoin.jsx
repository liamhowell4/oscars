import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignIn from '../components/auth/GoogleSignIn';

export default function GroupJoin() {
  const { code } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;

    const join = async () => {
      try {
        const codeDoc = await getDoc(doc(db, 'joinCodes', code.toUpperCase()));
        if (!codeDoc.exists()) {
          setError('This join link is invalid or has expired.');
          return;
        }
        const { groupId } = codeDoc.data();
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (!groupDoc.exists()) {
          setError('Group not found.');
          return;
        }
        if (!groupDoc.data().members.includes(user.uid)) {
          await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(user.uid) });
        }
        navigate('/groups');
      } catch (err) {
        console.error(err);
        setError('Failed to join group. Please try again.');
      }
    };

    join();
  }, [code, user, authLoading]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="deco-divider mb-4">
          <span className="text-gold/50 text-xs">&#9733;</span>
        </div>
        <h2 className="font-display text-gold text-2xl mb-3">Invalid Link</h2>
        <p className="text-cream/40 font-body text-sm mb-6">{error}</p>
        <button onClick={() => navigate('/groups')} className="btn-outline">
          Go to Groups
        </button>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="inline-block w-8 h-8 border border-gold/30 border-t-gold rotate-45 animate-spin mb-4" />
        <p className="text-cream/30 font-body text-sm uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="deco-divider mb-4">
          <span className="text-gold/50 text-xs">&#9733;</span>
        </div>
        <h2 className="font-display text-gold text-3xl mb-2">You're Invited</h2>
        <p className="text-cream/40 font-body text-sm mb-1">
          Sign in to join this Oscar Ballot group
        </p>
        <p className="font-mono text-gold/30 text-xs tracking-widest mb-8">{code.toUpperCase()}</p>
        <div className="flex justify-center">
          <GoogleSignIn />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-20 animate-fade-in-up">
      <div className="inline-block w-8 h-8 border border-gold/30 border-t-gold rotate-45 animate-spin mb-4" />
      <p className="text-cream/30 font-body text-sm uppercase tracking-widest">Joining group...</p>
    </div>
  );
}
