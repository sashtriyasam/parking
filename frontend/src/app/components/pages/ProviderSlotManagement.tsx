import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Settings2, Layers } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { providerService } from '@/services/provider.service';
import type { Facility } from '@/services/provider.service';
import type { VehicleType } from '@/types';

interface SlotRange {
  prefix: string;
  startNumber: number;
  count: number;
  floor: number;
  vehicleType: VehicleType;
  pricePerHour: number;
}

const VEHICLE_COLORS: Record<string, string> = {
  car: '#007AFF',
  CAR: '#007AFF',
  bike: '#34C759',
  BIKE: '#34C759',
  scooter: '#FF9F0A',
  SCOOTER: '#FF9F0A',
  truck: '#FF3B30',
  TRUCK: '#FF3B30',
};

export function ProviderSlotManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [slotRange, setSlotRange] = useState<SlotRange>({
    prefix: 'A',
    startNumber: 1,
    count: 10,
    floor: 1,
    vehicleType: 'car',
    pricePerHour: 50,
  });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [facilityData, slotsData] = await Promise.all([
        providerService.getFacilityDetails(id!),
        providerService.getFacilitySlots(id!)
      ]);
      setFacility(facilityData);
      setSlots(slotsData);
    } catch (error) {
      toast.error('Failed to load facility data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!id) return;
    setIsCreating(true);
    try {
      await providerService.bulkCreateSlots(id, {
        prefix: slotRange.prefix,
        start_number: Number(slotRange.startNumber),
        count: Number(slotRange.count),
        floor_number: Number(slotRange.floor),
        vehicle_type: slotRange.vehicleType.toUpperCase(),
      });
      if (slotRange.pricePerHour > 0) {
        await providerService.setPricingRule({
          facilityId: id,
          vehicleType: slotRange.vehicleType.toUpperCase(),
          hourlyRate: Number(slotRange.pricePerHour)
        });
      }
      toast.success('Slots created and pricing updated!');
      loadData();
    } catch (error) {
      toast.error('Failed to create slots');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (confirm('Are you sure you want to delete this slot?')) {
      try {
        await providerService.deleteSlot(slotId);
        toast.success('Slot deleted');
        setSlots(prev => prev.filter(s => s.id !== slotId));
      } catch (error) {
        toast.error('Failed to delete slot');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const labelClass = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block";
  const inputClass = "w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none";

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back nav */}
        <button
          onClick={() => navigate('/provider/facilities')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Facilities
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Slot Management</p>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{facility?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{facility?.address}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Slots Form */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Bulk Create Slots</h3>
                  <p className="text-muted-foreground text-xs">Add multiple slots at once</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Prefix (e.g. A, B)</label>
                    <input
                      className={inputClass}
                      value={slotRange.prefix}
                      onChange={e => setSlotRange({ ...slotRange, prefix: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Start Number</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={slotRange.startNumber}
                      onChange={e => setSlotRange({ ...slotRange, startNumber: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Number of Slots</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={slotRange.count}
                    onChange={e => setSlotRange({ ...slotRange, count: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Floor Number</label>
                  <Select
                    value={String(slotRange.floor)}
                    onValueChange={v => setSlotRange({ ...slotRange, floor: Number(v) })}
                  >
                    <SelectTrigger className="bg-secondary border-border rounded-lg text-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: facility?.total_floors || 1 }).map((_, i) => (
                        <SelectItem key={i} value={String(i + 1)}>Floor {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={labelClass}>Vehicle Type</label>
                  <Select
                    value={slotRange.vehicleType}
                    onValueChange={v => setSlotRange({ ...slotRange, vehicleType: v as VehicleType })}
                  >
                    <SelectTrigger className="bg-secondary border-border rounded-lg text-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="bike">Bike</SelectItem>
                      <SelectItem value="scooter">Scooter</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={labelClass}>Price Per Hour (₹)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={slotRange.pricePerHour}
                    onChange={e => setSlotRange({ ...slotRange, pricePerHour: Number(e.target.value) })}
                  />
                </div>

                {/* Preview strip */}
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Preview</p>
                  <p className="text-sm font-bold text-foreground">
                    {slotRange.prefix}{slotRange.startNumber} → {slotRange.prefix}{slotRange.startNumber + slotRange.count - 1}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {slotRange.count} slots · Floor {slotRange.floor} · ₹{slotRange.pricePerHour}/hr
                  </p>
                </div>

                <button
                  onClick={handleBulkCreate}
                  disabled={isCreating}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Generate Slots
                </button>
              </div>
            </div>
          </div>

          {/* Slots Grid */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Existing Slots</h3>
                  <p className="text-muted-foreground text-xs">{slots.length} slots configured</p>
                </div>
              </div>
              <div className="p-6">
                {slots.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                    <Layers className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium text-foreground mb-1">No slots yet</p>
                    <p className="text-xs">Use the form to generate slots for this facility.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {slots.map(slot => {
                      const vt = (slot.vehicleType || slot.vehicle_type || '').toLowerCase();
                      const accentColor = VEHICLE_COLORS[vt] || '#8E8E93';
                      return (
                        <div
                          key={slot.id}
                          className="relative group bg-secondary rounded-xl p-3 flex flex-col items-center hover:border-primary/30 border border-transparent transition-all"
                          style={{ borderColor: `${accentColor}22` }}
                        >
                          <p className="text-base font-black text-foreground">{slot.slotNumber}</p>
                          <span
                            className="text-[9px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                          >
                            {vt}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">F{slot.floor}</p>
                          <button
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onClick={() => handleDeleteSlot(slot.id)}
                            aria-label={`Delete slot ${slot.slotNumber}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
