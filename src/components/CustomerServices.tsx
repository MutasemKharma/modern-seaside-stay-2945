import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Gift, Percent, DollarSign, Bus, Utensils, CheckCircle } from "lucide-react";

interface CustomerService {
  id: string;
  service_type: 'food_discount' | 'bus_discount' | 'cashback' | 'promotional_gift';
  service_details: {
    discount_percentage?: number;
    amount?: number;
    description: string;
  };
  is_active: boolean;
  applied_at: string | null;
  expires_at: string | null;
}

export default function CustomerServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<CustomerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingService, setApplyingService] = useState<string | null>(null);

  // Service application form
  const [applicationData, setApplicationData] = useState({
    serviceType: '',
    bookingReference: '',
    amount: '',
  });

  useEffect(() => {
    if (user) {
      loadCustomerServices();
    }
  }, [user]);

  const loadCustomerServices = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_services')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading services",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyForService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setApplyingService(applicationData.serviceType);

    try {
      // First, verify the booking exists and belongs to the user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, total_amount')
        .eq('booking_reference', applicationData.bookingReference)
        .eq('user_id', user.id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found or does not belong to you');
      }

      // Create service application
      const serviceDetails = {
        description: getServiceDescription(applicationData.serviceType),
        booking_reference: applicationData.bookingReference,
        ...(applicationData.amount && { amount: parseFloat(applicationData.amount) }),
      };

      const { error } = await supabase
        .from('customer_services')
        .insert([{
          user_id: user.id,
          booking_id: booking.id,
          service_type: applicationData.serviceType,
          service_details: serviceDetails,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }]);

      if (error) throw error;

      toast({
        title: "Service Applied!",
        description: "Your service application has been submitted successfully.",
      });

      setApplicationData({ serviceType: '', bookingReference: '', amount: '' });
      loadCustomerServices();
    } catch (error: any) {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplyingService(null);
    }
  };

  const getServiceDescription = (type: string) => {
    const descriptions = {
      food_discount: 'Discount on food services and local cuisine',
      bus_discount: 'Discount on bus and transportation services',
      cashback: 'Cashback on completed booking',
      promotional_gift: 'Promotional gift or bonus service',
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  const getServiceIcon = (type: string) => {
    const icons = {
      food_discount: <Utensils className="h-5 w-5" />,
      bus_discount: <Bus className="h-5 w-5" />,
      cashback: <DollarSign className="h-5 w-5" />,
      promotional_gift: <Gift className="h-5 w-5" />,
    };
    return icons[type as keyof typeof icons];
  };

  const getServiceColor = (type: string) => {
    const colors = {
      food_discount: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      bus_discount: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cashback: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      promotional_gift: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[type as keyof typeof colors];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to access customer services.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Apply for Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Apply for Customer Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={applyForService} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type</Label>
                <Select 
                  value={applicationData.serviceType} 
                  onValueChange={(value) => setApplicationData({ ...applicationData, serviceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food_discount">Food Discount</SelectItem>
                    <SelectItem value="bus_discount">Bus Discount</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="promotional_gift">Promotional Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="booking-ref">Booking Reference</Label>
                <Input
                  id="booking-ref"
                  placeholder="FR-XXXXXXXX"
                  value={applicationData.bookingReference}
                  onChange={(e) => setApplicationData({ ...applicationData, bookingReference: e.target.value })}
                  required
                />
              </div>
              
              {(applicationData.serviceType === 'cashback') && (
                <div className="space-y-2">
                  <Label htmlFor="amount">Requested Amount (JOD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={applicationData.amount}
                    onChange={(e) => setApplicationData({ ...applicationData, amount: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={!applicationData.serviceType || !applicationData.bookingReference || applyingService === applicationData.serviceType}
            >
              {applyingService === applicationData.serviceType ? 'Applying...' : 'Apply for Service'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Services */}
      <Card>
        <CardHeader>
          <CardTitle>Your Customer Services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading services...</p>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground">No services applied yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(service.service_type)}
                        <h4 className="font-semibold capitalize">
                          {service.service_type.replace('_', ' ')}
                        </h4>
                      </div>
                      <Badge className={getServiceColor(service.service_type)}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {service.service_details.description}
                    </p>
                    
                    {service.service_details.amount && (
                      <p className="text-sm font-medium">
                        Amount: {service.service_details.amount} JOD
                      </p>
                    )}
                    
                    {service.applied_at && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                        <CheckCircle className="h-3 w-3" />
                        Applied on {new Date(service.applied_at).toLocaleDateString()}
                      </div>
                    )}
                    
                    {service.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(service.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}