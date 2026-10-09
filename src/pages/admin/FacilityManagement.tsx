import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Building2, 
  Phone, 
  Clock, 
  Navigation, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ExternalLink,
  Hospital,
  Loader2,
  Filter,
  Map as MapIcon,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Facility {
  id: string;
  name: string;
  category: string;
  ownership: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string[];
  operating_hours: string;
  contact_number: string;
}

// Carmona, Cavite geographical center
const CARMONA_CENTER = { lat: 14.3167, lng: 121.0560 };

// Standard Clinical TB Services Catalog
const PRESET_SERVICES = [
  "TB-DOTS Treatment",
  "GeneXpert MTB/RIF",
  "DSSM Sputum Microscopy",
  "Chest X-Ray Diagnostics",
  "Tuberculin Skin Testing (TST)",
  "Pediatric TB Care",
  "Free Anti-TB Medications",
  "Clinical Consultation & Referral",
  "Inpatient Care",
  "Emergency Triage"
];

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Map state
  const [mapSearchText, setMapSearchText] = useState("");
  const [isMapSearching, setIsMapSearching] = useState(false);

  // Custom service input state
  const [customServiceText, setCustomServiceText] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Health Center',
    ownership: 'Public',
    address: '',
    latitude: '',
    longitude: '',
    services: [] as string[],
    operating_hours: '',
    contact_number: ''
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Leaflet Map References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFacilities(data || []);
    } catch (err: any) {
      console.error('Error fetching facilities:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = facilities.length;
    const publicUnits = facilities.filter(f => f.ownership?.toLowerCase() === 'public').length;
    const privateUnits = facilities.filter(f => f.ownership?.toLowerCase() === 'private').length;
    const dotsUnits = facilities.filter(f => 
      f.services?.some(s => s.toLowerCase().includes('dots') || s.toLowerCase().includes('tb'))
    ).length;

    return { total, publicUnits, privateUnits, dotsUnits };
  }, [facilities]);

  // Client-side search and filtering
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch = 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        categoryFilter === "all" || 
        f.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [facilities, searchQuery, categoryFilter]);

  // Dynamically load Leaflet for interactive pin placement
  const initLeafletMap = (initialLat: number, initialLng: number) => {
    if (!mapContainerRef.current) return;

    const setup = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const customPin = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color:#4F46E5; width:26px; height:26px; border-radius:50%; border:3px solid #FFFFFF; box-shadow:0 4px 12px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; transform: translate(-50%, -50%);">
                 <div style="background-color:#FFFFFF; width:8px; height:8px; border-radius:50%;"></div>
               </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customPin,
      }).addTo(map);

      marker.on('dragend', function (e: any) {
        const pos = e.target.getLatLng();
        setFormData(prev => ({
          ...prev,
          latitude: pos.lat.toFixed(6),
          longitude: pos.lng.toFixed(6)
        }));
      });

      map.on('click', function (e: any) {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      setTimeout(() => map.invalidateSize(), 200);
    };

    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = setup;
      document.body.appendChild(script);
    } else {
      setup();
    }
  };

  const handleOpenModal = (facility?: Facility) => {
    let lat = CARMONA_CENTER.lat;
    let lng = CARMONA_CENTER.lng;

    if (facility) {
      lat = facility.latitude;
      lng = facility.longitude;
      setEditingId(facility.id);
      setFormData({
        name: facility.name,
        category: facility.category,
        ownership: facility.ownership,
        address: facility.address,
        latitude: facility.latitude.toString(),
        longitude: facility.longitude.toString(),
        services: facility.services || [],
        operating_hours: facility.operating_hours || '',
        contact_number: facility.contact_number || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        category: 'Health Center',
        ownership: 'Public',
        address: '',
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        services: ['TB-DOTS Treatment', 'GeneXpert MTB/RIF', 'DSSM Sputum Microscopy'],
        operating_hours: '8:00 AM - 5:00 PM',
        contact_number: ''
      });
    }

    setCustomServiceText("");
    setModalOpen(true);
    setTimeout(() => initLeafletMap(lat, lng), 250);
  };

  // Landmark search
  const handleMapSearch = async () => {
    if (!mapSearchText.trim()) return;
    setIsMapSearching(true);
    try {
      const query = encodeURIComponent(`${mapSearchText}, Carmona, Cavite, Philippines`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const found = data[0];
        const lat = parseFloat(found.lat);
        const lng = parseFloat(found.lon);

        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          address: prev.address || found.display_name.split(',').slice(0, 3).join(',')
        }));

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      } else {
        alert("Location not found. Click directly on the map to pinpoint.");
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    } finally {
      setIsMapSearching(false);
    }
  };

  // Service toggle helpers
  const handleToggleService = (service: string) => {
    setFormData(prev => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists 
          ? prev.services.filter(s => s !== service)
          : [...prev.services, service]
      };
    });
  };

  const handleAddCustomService = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customServiceText.trim();
    if (!trimmed) return;

    if (!formData.services.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, trimmed]
      }));
    }
    setCustomServiceText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      category: formData.category,
      ownership: formData.ownership,
      address: formData.address,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      services: formData.services,
      operating_hours: formData.operating_hours,
      contact_number: formData.contact_number
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('facilities')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        setStatusMessage({ type: 'success', text: 'Facility updated and synced with Mobile App!' });
      } else {
        const { error } = await supabase
          .from('facilities')
          .insert([payload]);

        if (error) throw error;
        setStatusMessage({ type: 'success', text: 'New Facility added and synced with Mobile App!' });
      }

      setModalOpen(false);
      fetchFacilities();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save facility' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the patient locator map?`)) return;

    try {
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFacilities();
    } catch (err: any) {
      alert(`Error deleting facility: ${err.message}`);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* --- HEADER COMMAND STRIP --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <Building2 className="h-3 w-3" />
                City Health Office • Patient GIS Locator Registry
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Facility Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Configure and maintain TB-DOTS units, RHUs, and referral hospitals displayed in real-time on the patient mobile app.
            </p>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold text-xs h-10 px-4 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add New Facility
          </Button>
        </div>

        {/* --- KPI STATS RIBBON --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Facilities</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Mapped across Carmona</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Public RHUs & Centers</span>
            <p className="text-2xl font-black text-emerald-950 mt-1">{stats.publicUnits}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Government-operated</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Private Clinics/Hospitals</span>
            <p className="text-2xl font-black text-amber-950 mt-1">{stats.privateUnits}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Accredited referral sites</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">TB-DOTS Capable</span>
            <p className="text-2xl font-black text-indigo-950 mt-1">{stats.dotsUnits}</p>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Active medication dispensing</span>
          </div>
        </div>

        {/* --- SEARCH & FILTER TOOLBAR --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search facility name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs focus-visible:ring-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden px-2.5 h-10">
              <Filter className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Health Center">Health Centers</option>
                <option value="Hospital">Hospitals</option>
                <option value="Clinic">Clinics</option>
                <option value="Diagnostic Center">Diagnostic Centers</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- NOTIFICATION BANNER --- */}
        {statusMessage && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold border transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
            {statusMessage.text}
          </div>
        )}

        {/* --- FACILITIES CARD GRID --- */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-indigo-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-xs font-bold text-slate-400 mt-2">Loading facility registry...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs">
            <Building2 className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Facilities Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? "No facilities match your search criteria." : "Get started by adding clinical facilities to the GIS registry."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFacilities.map((facility) => (
              <div 
                key={facility.id} 
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {facility.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                        {facility.category}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      facility.ownership?.toLowerCase() === 'public'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {facility.ownership}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{facility.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Navigation className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                      >
                        Verify Pin <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    {facility.operating_hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{facility.operating_hours}</span>
                      </div>
                    )}

                    {facility.contact_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{facility.contact_number}</span>
                      </div>
                    )}
                  </div>

                  {facility.services && facility.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                      {facility.services.map((service, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] bg-indigo-50/70 text-indigo-900 border border-indigo-100 px-2 py-0.5 rounded-md font-bold"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(facility)}
                    className="h-8 gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(facility.id, facility.name)}
                    className="h-8 gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- REGISTER / EDIT FACILITY MODAL --- */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Hospital className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {editingId ? 'Edit Clinical Facility' : 'Register New Health Facility'}
                    </h2>
                    <p className="text-[11px] text-slate-400">Pinpoint location to sync turn-by-turn navigation with patient mobile app</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                
                {/* --- INTERACTIVE MAP PINPOINT PICKER --- */}
                <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase">
                      <MapIcon className="h-4 w-4 text-indigo-600" />
                      Pinpoint Location on Map
                    </Label>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Drag pin or click map
                    </span>
                  </div>

                  {/* Landmark search bar */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Search landmark or barangay (e.g. Maduya, Carmona)..."
                      value={mapSearchText}
                      onChange={(e) => setMapSearchText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleMapSearch(); } }}
                      className="h-9 bg-white border-slate-300 text-xs rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMapSearch}
                      disabled={isMapSearching}
                      className="h-9 rounded-xl border-slate-300 text-xs font-bold text-slate-700 bg-white"
                    >
                      {isMapSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Locate"}
                    </Button>
                  </div>

                  {/* Leaflet Map Canvas */}
                  <div 
                    ref={mapContainerRef} 
                    className="h-52 w-full rounded-xl border border-slate-300 overflow-hidden shadow-inner relative z-0"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>Click anywhere on the map or drag the pin to set coordinates.</span>
                    {formData.latitude && formData.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                      >
                        Test on Google Maps <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Facility Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Facility Name</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Carmona Rural Health Unit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 rounded-xl bg-slate-50 border-slate-300 text-xs focus-visible:ring-indigo-600"
                  />
                </div>

                {/* Category & Ownership */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase">Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="Health Center">Health Center</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Clinic">Clinic</option>
                      <option value="Diagnostic Center">Diagnostic Center</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase">Ownership</Label>
                    <select
                      value={formData.ownership}
                      onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Physical Address */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Physical Address</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Street, Barangay, Carmona, Cavite"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-10 rounded-xl bg-slate-50 border-slate-300 text-xs focus-visible:ring-indigo-600"
                  />
                </div>

                {/* Coordinates (Auto-populated from map pin) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase">
                      Latitude <span className="text-indigo-600 font-semibold lowercase">(auto from pin)</span>
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      required
                      placeholder="14.316654"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="h-10 rounded-xl bg-indigo-50/50 border-indigo-200 text-xs font-mono font-bold text-indigo-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase">
                      Longitude <span className="text-indigo-600 font-semibold lowercase">(auto from pin)</span>
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      required
                      placeholder="121.056088"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="h-10 rounded-xl bg-indigo-50/50 border-indigo-200 text-xs font-mono font-bold text-indigo-950"
                    />
                  </div>
                </div>

                {/* --- SERVICES MULTI-SELECT DROPDOWN & TAGS --- */}
                <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                  <Label className="text-xs font-bold text-slate-700 uppercase block">
                    Clinical Services Offered
                  </Label>

                  {/* Dropdown to add preset services */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleToggleService(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="">+ Add service from preset list...</option>
                      {PRESET_SERVICES.map((s) => (
                        <option 
                          key={s} 
                          value={s}
                          disabled={formData.services.includes(s)}
                        >
                          {formData.services.includes(s) ? `✓ ${s} (Selected)` : s}
                        </option>
                      ))}
                    </select>

                    {/* Input to add any custom service */}
                    <div className="flex gap-1.5">
                      <Input
                        type="text"
                        placeholder="Or type custom service..."
                        value={customServiceText}
                        onChange={(e) => setCustomServiceText(e.target.value)}
                        onKeyDown={handleAddCustomService}
                        className="h-10 rounded-xl bg-white border-slate-300 text-xs focus-visible:ring-indigo-600"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomService}
                        disabled={!customServiceText.trim()}
                        className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Selected Services Pill Badges */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Selected Services ({formData.services.length}):
                    </span>
                    {formData.services.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">
                        No services selected yet. Pick from the dropdown or type a custom one.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.services.map((service) => (
                          <span
                            key={service}
                            className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                          >
                            <Check className="h-3 w-3 text-indigo-600" />
                            {service}
                            <button
                              type="button"
                              onClick={() => handleToggleService(service)}
                              className="text-indigo-400 hover:text-rose-600 transition-colors ml-0.5"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Operating Hours & Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase">Operating Hours</Label>
                    <Input
                      type="text"
                      placeholder="8:00 AM - 5:00 PM"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      className="h-10 rounded-xl bg-slate-50 border-slate-300 text-xs focus-visible:ring-indigo-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 uppercase">Contact Number</Label>
                    <Input
                      type="text"
                      placeholder="(046) 123-4567"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      className="h-10 rounded-xl bg-slate-50 border-slate-300 text-xs focus-visible:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl text-xs h-9 border-slate-300 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl text-xs font-bold h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    {editingId ? 'Save Changes' : 'Register Facility'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}