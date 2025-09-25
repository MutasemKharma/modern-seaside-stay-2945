import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface Chalet {
  id?: string;
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

interface ChaletFormProps {
  chalet?: Chalet | null;
  onClose: () => void;
  isAdmin: boolean;
}

const JORDANIAN_GOVERNORATES = [
  'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Madaba', 'Karak', 'Tafilah', 
  'Maan', 'Aqaba', 'Jerash', 'Ajloun', 'Mafraq'
];

const COMMON_FEATURES = [
  'Swimming Pool', 'BBQ Area', 'WiFi', 'Parking', 'Kitchen', 
  'Air Conditioning', 'Garden', 'Playground', 'Sports Field',
  'Restaurant', 'Spa', 'Transport Service', 'Beach Access'
];

export default function ChaletForm({ chalet, onClose, isAdmin }: ChaletFormProps) {
  const [formData, setFormData] = useState<Chalet>({
    name: '',
    description: '',
    governorate: '',
    address: '',
    category: 'family',
    price_per_day: 0,
    max_capacity: 1,
    features: [],
    images: [],
    has_pool: false,
    pool_sanitized: false,
    cleanliness_rating: 5.0,
    is_active: true,
    ...chalet
  });
  const [newFeature, setNewFeature] = useState('');
  const [newImage, setNewImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const chaletData = {
        ...formData,
        owner_id: chalet?.id ? undefined : user.id, // Only set owner_id for new chalets
      };

      if (chalet?.id) {
        // Update existing chalet
        const { error } = await supabase
          .from('chalets')
          .update(chaletData)
          .eq('id', chalet.id);

        if (error) throw error;
        toast.success('Chalet updated successfully!');
      } else {
        // Create new chalet
        const { error } = await supabase
          .from('chalets')
          .insert([chaletData]);

        if (error) throw error;
        toast.success('Chalet created successfully!');
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error saving chalet');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = (feature: string) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
    setNewFeature('');
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const addImage = () => {
    if (newImage && !formData.images.includes(newImage)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      setNewImage('');
    }
  };

  const removeImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image)
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            {chalet?.id ? 'Edit Chalet' : 'Add New Chalet'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Chalet Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="governorate">Governorate</Label>
                  <Select
                    value={formData.governorate}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, governorate: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select governorate" />
                    </SelectTrigger>
                    <SelectContent>
                      {JORDANIAN_GOVERNORATES.map(gov => (
                        <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Capacity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="youth">Youth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price per Day ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_day: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Maximum Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rating">Cleanliness Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.cleanliness_rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, cleanliness_rating: parseFloat(e.target.value) || 5 }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pool Information */}
          <Card>
            <CardHeader>
              <CardTitle>Pool & Facilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_pool"
                  checked={formData.has_pool}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    has_pool: checked as boolean,
                    pool_sanitized: checked ? prev.pool_sanitized : false
                  }))}
                />
                <Label htmlFor="has_pool">Has Swimming Pool</Label>
              </div>

              {formData.has_pool && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pool_sanitized"
                    checked={formData.pool_sanitized}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pool_sanitized: checked as boolean }))}
                  />
                  <Label htmlFor="pool_sanitized">Pool is Sanitized</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                />
                <Label htmlFor="is_active">Active (visible to customers)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features & Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {COMMON_FEATURES.map(feature => (
                  <Button
                    key={feature}
                    type="button"
                    variant={formData.features.includes(feature) ? "default" : "outline"}
                    size="sm"
                    onClick={() => formData.features.includes(feature) ? removeFeature(feature) : addFeature(feature)}
                  >
                    {feature}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature(newFeature))}
                />
                <Button type="button" onClick={() => addFeature(newFeature)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.features.map(feature => (
                  <Badge key={feature} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(feature)}>
                    {feature} <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <Button type="button" onClick={addImage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Chalet image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage(image)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (chalet?.id ? 'Update Chalet' : 'Create Chalet')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}