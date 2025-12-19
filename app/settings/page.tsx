'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Input } from '@/components/Input';
import {
  User,
  Settings,
  Key,
  Bell,
  Shield,
  Loader,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Briefcase,
  Palette,
  Monitor,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type Tab = 'account' | 'workspaces' | 'api' | 'notifications';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [theme, setTheme] = useState('auto');
  const [language, setLanguage] = useState('en');
  
  // API Key state
  const [newKey, setNewKey] = useState({ provider: 'openai', key: '', label: '' });
  const [showKeyForm, setShowKeyForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch user profile
      const userRes = await fetch('/api/user/profile', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.data);
        setName(userData.data.name || '');
        setEmail(userData.data.email || '');
        setBio(userData.data.bio || '');
        setAvatar(userData.data.avatar || '');
        setTheme(userData.data.theme || 'auto');
        setLanguage(userData.data.language || 'en');
      }

      // Fetch API keys
      const keysRes = await fetch('/api/llm-keys', { headers });
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.data || []);
      }
      
      // Fetch workspaces (we'd need an endpoint for all user workspaces)
      // For now assuming we can get them or they are part of user data (workspaces array)
      
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name,
          bio,
          avatar,
          theme,
          language
        }),
      });
      
      if (response.ok) {
        // Show success
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddKey = async () => {
    try {
      const response = await fetch('/api/llm-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          provider: newKey.provider,
          apiKey: newKey.key,
          label: newKey.label
        }),
      });

      if (response.ok) {
        setNewKey({ provider: 'openai', key: '', label: '' });
        setShowKeyForm(false);
        fetchData(); // Refresh keys
      }
    } catch (error) {
      console.error('Failed to add key:', error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return;
    
    try {
      await fetch(`/api/llm-keys/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const renderAccountTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">Avatar URL</label>
                <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <Input value={email} disabled className="bg-background-secondary" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">System Auto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">LLM API Keys</h2>
        <Button size="sm" onClick={() => setShowKeyForm(!showKeyForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Key
        </Button>
      </div>
      
      {showKeyForm && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
                  <select 
                    value={newKey.provider}
                    onChange={(e) => setNewKey({...newKey, provider: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Label</label>
                  <Input 
                    value={newKey.label} 
                    onChange={(e) => setNewKey({...newKey, label: e.target.value})}
                    placeholder="e.g. Personal Key"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
                <Input 
                  type="password"
                  value={newKey.key} 
                  onChange={(e) => setNewKey({...newKey, key: e.target.value})}
                  placeholder="sk-..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowKeyForm(false)}>Cancel</Button>
                <Button onClick={handleAddKey} disabled={!newKey.key}>Save Key</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {apiKeys.map((key) => (
          <Card key={key.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-background-secondary text-foreground">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-foreground">{key.label || key.provider}</h3>
                    {key.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary uppercase">{key.provider} • Added {new Date(key.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteKey(key.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {apiKeys.length === 0 && !showKeyForm && (
          <div className="text-center py-8 text-foreground-secondary border-2 border-dashed border-border rounded-lg">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No API keys configured</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-background-secondary p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>
        <nav className="space-y-2">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'api', label: 'API Keys', icon: Key },
            { id: 'workspaces', label: 'Workspaces', icon: Briefcase },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-background/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      
      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 md:hidden">
            <h1 className="text-2xl font-bold text-foreground mb-4">Settings</h1>
            <select 
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as Tab)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="account">Account</option>
              <option value="api">API Keys</option>
              <option value="workspaces">Workspaces</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>
          
          {activeTab === 'account' && renderAccountTab()}
          {activeTab === 'api' && renderApiTab()}
          {activeTab === 'workspaces' && (
            <div className="text-center py-12 text-foreground-secondary">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Workspace management coming soon</p>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="text-center py-12 text-foreground-secondary">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Notification settings coming soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
