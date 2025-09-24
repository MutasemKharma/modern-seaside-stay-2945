import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Bus, Car, Users, Clock, MapPin, Phone } from "lucide-react";

interface TransportBooking {
  id: string;
  booking_id: string;
  transport_type: 'bus' | 'private_car' | 'minibus';
  pickup_location: string;
  pickup_time: string;
  return_time: string | null;
  passengers_count: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  driver_details: {
    name?: string;
    phone?: string;
    vehicle_info?: string;
  } | null;
  created_at: string;
}

export default function TransportationBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bookingData, setBookingData] = useState({
    bookingId: '',
    transportType: '',
    pickupLocation: '',
    pickupTime: '',
    returnTime: '',
    passengersCount: 1,
    specialRequests: '',
  });

  useEffect(() => {
    if (user) {
      loadUserBookings();
      loadTransportBookings();
    }
  }, [user]);

  const loadUserBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_reference, check_in_date, check_out_date')
        .eq('user_id', user?.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading bookings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadTransportBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('transportation_bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransportBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading transport bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (transportType: string, passengers: number) => {
    const basePrices = {
      bus: 15, // JOD per person
      private_car: 80, // JOD flat rate
      minibus: 120, // JOD flat rate
    };
    
    const basePrice = basePrices[transportType as keyof typeof basePrices] || 0;
    return transportType === 'bus' ? basePrice * passengers : basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const price = calculatePrice(bookingData.transportType, bookingData.passengersCount);

      const { error } = await supabase
        .from('transportation_bookings')
        .insert([{
          booking_id: bookingData.bookingId,
          user_id: user.id,
          transport_type: bookingData.transportType,
          pickup_location: bookingData.pickupLocation,
          pickup_time: new Date(bookingData.pickupTime).toISOString(),
          return_time: bookingData.returnTime ? new Date(bookingData.returnTime).toISOString() : null,
          passengers_count: bookingData.passengersCount,
          price: price,
          status: 'pending',
        }]);

      if (error) throw error;

      toast({
        title: "Transportation Booked!",
        description: "Your transportation request has been submitted. Our team will contact you shortly.",
      });

      setBookingData({
        bookingId: '',
        transportType: '',
        pickupLocation: '',
        pickupTime: '',
        returnTime: '',
        passengersCount: 1,
        specialRequests: '',
      });

      loadTransportBookings();
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTransportIcon = (type: string) => {
    const icons = {
      bus: <Bus className="h-5 w-5" />,
      private_car: <Car className="h-5 w-5" />,
      minibus: <Users className="h-5 w-5" />,
    };
    return icons[type as keyof typeof icons];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return colors[status as keyof typeof colors];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to book transportation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Book Transportation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Book Transportation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-select">Select Your Booking</Label>
                <Select 
                  value={bookingData.bookingId} 
                  onValueChange={(value) => setBookingData({ ...bookingData, bookingId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a confirmed booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {userBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.booking_reference} - {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transport-type">Transport Type</Label>
                <Select 
                  value={bookingData.transportType} 
                  onValueChange={(value) => setBookingData({ ...bookingData, transportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transport type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Bus (JOD 15/person)</SelectItem>
                    <SelectItem value="private_car">Private Car (JOD 80 flat)</SelectItem>
                    <SelectItem value="minibus">Minibus (JOD 120 flat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-location">Pickup Location</Label>
                <Input
                  id="pickup-location"
                  placeholder="Enter pickup address"
                  value={bookingData.pickupLocation}
                  onChange={(e) => setBookingData({ ...bookingData, pickupLocation: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers">Number of Passengers</Label>
                <Select 
                  value={bookingData.passengersCount.toString()} 
                  onValueChange={(value) => setBookingData({ ...bookingData, passengersCount: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} passenger{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-time">Pickup Date & Time</Label>
                <Input
                  id="pickup-time"
                  type="datetime-local"
                  value={bookingData.pickupTime}
                  onChange={(e) => setBookingData({ ...bookingData, pickupTime: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return-time">Return Date & Time (Optional)</Label>
                <Input
                  id="return-time"
                  type="datetime-local"
                  value={bookingData.returnTime}
                  onChange={(e) => setBookingData({ ...bookingData, returnTime: e.target.value })}
                />
              </div>
            </div>

            {bookingData.transportType && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="font-medium">
                  Estimated Price: {calculatePrice(bookingData.transportType, bookingData.passengersCount)} JOD
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="special-requests">Special Requests</Label>
              <Textarea
                id="special-requests"
                placeholder="Any special requirements or notes..."
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
              />
            </div>

            <Button 
              type="submit" 
              className="btn-primary"
              disabled={!bookingData.bookingId || !bookingData.transportType || submitting}
            >
              {submitting ? 'Booking...' : 'Book Transportation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Transport Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Transportation Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading transport bookings...</p>
          ) : transportBookings.length === 0 ? (
            <p className="text-muted-foreground">No transportation bookings yet.</p>
          ) : (
            <div className="space-y-4">
              {transportBookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTransportIcon(booking.transport_type)}
                        <h4 className="font-semibold capitalize">
                          {booking.transport_type.replace('_', ' ')}
                        </h4>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.pickup_location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(booking.pickup_time), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        {booking.return_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Return: {format(new Date(booking.return_time), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.passengers_count} passenger{booking.passengers_count > 1 ? 's' : ''}</span>
                        </div>
                        <p className="font-medium">Price: {booking.price} JOD</p>
                        
                        {booking.driver_details && booking.status === 'confirmed' && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <p className="font-medium text-green-800 dark:text-green-200">
                              Driver Assigned
                            </p>
                            {booking.driver_details.name && (
                              <p className="text-sm">Name: {booking.driver_details.name}</p>
                            )}
                            {booking.driver_details.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {booking.driver_details.phone}
                              </div>
                            )}
                            {booking.driver_details.vehicle_info && (
                              <p className="text-sm">Vehicle: {booking.driver_details.vehicle_info}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
