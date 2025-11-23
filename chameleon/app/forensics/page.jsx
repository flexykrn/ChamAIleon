'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/app/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Activity, MapPin, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ForensicsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attacks, setAttacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sqli: 0,
    xss: 0,
    bruteForce: 0,
    benign: 0
  });
  const [user, setUser] = useState(null);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/authentication/signinpage');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Real-time attack listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'attacks'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attacksData = [];
      let sqliCount = 0, xssCount = 0, bruteCount = 0, benignCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        attacksData.push({ id: doc.id, ...data });
        
        const classification = data.classification?.toLowerCase();
        if (classification === 'sqli' || classification === 'sql injection') sqliCount++;
        else if (classification === 'xss') xssCount++;
        else if (classification === 'brute force' || classification === 'bruteforce') bruteCount++;
        else if (classification === 'benign') benignCount++;
      });

      setAttacks(attacksData);
      setStats({
        total: attacksData.length,
        sqli: sqliCount,
        xss: xssCount,
        bruteForce: bruteCount,
        benign: benignCount
      });
    });

    return () => unsubscribe();
  }, [user]);

  const getClassificationColor = (classification) => {
    const cls = classification?.toLowerCase();
    if (cls === 'sqli' || cls === 'sql injection') return 'bg-red-500';
    if (cls === 'xss') return 'bg-orange-500';
    if (cls === 'brute force' || cls === 'bruteforce') return 'bg-yellow-500';
    if (cls === 'benign') return 'bg-green-500';
    return 'bg-gray-500';
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Classification', 'Confidence', 'Input', 'IP', 'Country', 'City', 'Deceptive Response'],
      ...attacks.map(a => [
        a.timestamp?.toDate().toISOString() || '',
        a.classification || '',
        a.confidence || '',
        a.input || '',
        a.ip || '',
        a.country || '',
        a.city || '',
        a.deceptiveResponse || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading forensic data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="h-12 w-12 text-green-400" />
          <div>
            <h1 className="text-4xl font-bold text-green-400">
              Forensic Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time Attack Monitoring System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportLogs} className="bg-blue-600 hover:bg-blue-700">
            📥 Export Logs
          </Button>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Logged in as</p>
            <p className="text-green-400 font-semibold">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-6 bg-gray-800 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Attempts</div>
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-400">{stats.sqli}</div>
              <div className="text-gray-400 text-sm">SQL Injections</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-orange-400">{stats.xss}</div>
              <div className="text-gray-400 text-sm">XSS Attacks</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-400">{stats.bruteForce}</div>
              <div className="text-gray-400 text-sm">Brute Force</div>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-400">{stats.benign}</div>
              <div className="text-gray-400 text-sm">Benign</div>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Attack Log Table */}
      <Card className="p-6 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Live Attack Log
          </h2>
          <Badge className="bg-green-500 animate-pulse">
            {attacks.length} Records
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-green-400 border-b-2 border-gray-700">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Type</th>
                <th className="p-3">Input</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Location</th>
                <th className="p-3">Detected By</th>
                <th className="p-3">XAI</th>
              </tr>
            </thead>
            <tbody>
              {attacks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No attacks detected yet. System is monitoring...
                  </td>
                </tr>
              ) : (
                attacks.map((attack) => (
                  <tr 
                    key={attack.id} 
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-3 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="font-mono text-xs">
                          {attack.timestamp?.toDate().toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getClassificationColor(attack.classification)}>
                        {attack.classification || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs text-gray-400 max-w-xs truncate">
                        {attack.input || 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(attack.confidence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-blue-400 font-semibold text-xs">
                          {((attack.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-xs text-gray-400">
                        {attack.ip || 'Unknown'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>{attack.city || 'Unknown'}, {attack.country || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-blue-400 text-xs">
                        {attack.detectedBy || 'Chameleon Model'}
                      </div>
                    </td>
                    <td className="p-3">
                      {attack.xaiExplanation ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30"
                          onClick={() => {
                            alert(JSON.stringify(attack.xaiExplanation, null, 2));
                          }}
                        >
                          View
                        </Button>
                      ) : (
                        <span className="text-gray-600 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
