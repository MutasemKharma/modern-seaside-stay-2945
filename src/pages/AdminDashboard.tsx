import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, Plus, Edit, Home, Users, Building } from 'lucide-react';
import ChaletForm from '@/components/admin/ChaletForm';

interface Chalet {
  id: string;
  name: string;
  description: string;
  governorate: string;
  address: string;
  category: string;
  price_per_day: number;
  max_capacity: number;
  features: string[];
  images: string[];
  has_pool: boolean;
  pool_sanitized: boolean;
  cleanliness_rating: number;
  is_active: boolean;
}

interface Profile {
  role: 'admin' | 'chalet_owner';
  full_name: string;
}

export default function AdminDashboard() {
  const [chalets, setChalets] = useState<Chalet[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChalet, setEditingChalet] = useState<Chalet | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadChalets();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/admin/login');
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single();

    if (error || !profileData || (profileData.role !== 'admin' && profileData.role !== 'chalet_owner')) {
      toast.error('Access denied');
      navigate('/admin/login');
      return;
    }

    setProfile(profileData);
  };

  const loadChalets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      let query = supabase.from('chalets').select('*');
      
      // If user is chalet_owner, only show their chalets
      if (profileData?.role === 'chalet_owner') {
        query = query.eq('owner_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast.error('Error loading chalets');
        return;
      }

      setChalets(data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Error loading dashboard');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleEdit = (chalet: Chalet) => {
    setEditingChalet(chalet);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingChalet(null);
    loadChalets(); // Refresh the list
  };

  const toggleChaletStatus = async (chalet: Chalet) => {
    const { error } = await supabase
      .from('chalets')
      .update({ is_active: !chalet.is_active })
      .eq('id', chalet.id);

    if (error) {
      toast.error('Error updating chalet status');
      return;
    }

    toast.success(`Chalet ${chalet.is_active ? 'deactivated' : 'activated'}`);
    loadChalets();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <ChaletForm
        chalet={editingChalet}
        onClose={handleFormClose}
        isAdmin={profile?.role === 'admin'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || 'Admin'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chalets</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chalets.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chalets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chalets.filter(c => c.is_active).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${chalets.length ? Math.round(chalets.reduce((sum, c) => sum + c.price_per_day, 0) / chalets.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Chalet Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Chalets</h2>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Chalet
          </Button>
        </div>

        {/* Chalets List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chalets.map((chalet) => (
            <Card key={chalet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{chalet.name}</CardTitle>
                  <Badge variant={chalet.is_active ? "default" : "secondary"}>
                    {chalet.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {chalet.description}
                </p>
                <div className="space-y-1 text-sm">
                  <p><strong>Location:</strong> {chalet.governorate}</p>
                  <p><strong>Category:</strong> {chalet.category}</p>
                  <p><strong>Price:</strong> ${chalet.price_per_day}/day</p>
                  <p><strong>Capacity:</strong> {chalet.max_capacity} guests</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(chalet)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={chalet.is_active ? "destructive" : "default"}
                    onClick={() => toggleChaletStatus(chalet)}
                  >
                    {chalet.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {chalets.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No chalets yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first chalet to the system.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Chalet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}