import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
  AlertCircle
} from 'lucide-react';

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

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Health Center',
    ownership: 'Public',
    address: '',
    latitude: '',
    longitude: '',
    services: '',
    operating_hours: '',
    contact_number: ''
  });

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleOpenModal = (facility?: Facility) => {
    if (facility) {
      setEditingId(facility.id);
      setFormData({
        name: facility.name,
        category: facility.category,
        ownership: facility.ownership,
        address: facility.address,
        latitude: facility.latitude.toString(),
        longitude: facility.longitude.toString(),
        services: facility.services ? facility.services.join(', ') : '',
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
        latitude: '',
        longitude: '',
        services: '',
        operating_hours: '',
        contact_number: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const servicesArray = formData.services
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      name: formData.name,
      category: formData.category,
      ownership: formData.ownership,
      address: formData.address,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      services: servicesArray,
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
        setStatusMessage({ type: 'success', text: 'Facility updated successfully!' });
      } else {
        const { error } = await supabase
          .from('facilities')
          .insert([payload]);

        if (error) throw error;
        setStatusMessage({ type: 'success', text: 'Facility added successfully!' });
      }

      setModalOpen(false);
      fetchFacilities();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save facility' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#283618]">Facility Management</h1>
          <p className="text-sm text-[#606C38] mt-1">
            Add and manage TB DOTS Centers, RHUs, and hospitals displayed on the patient locator map.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#283618] hover:bg-[#606C38] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm w-fit"
        >
          <Plus size={18} />
          Add Facility
        </button>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMessage.text}
        </div>
      )}

      {/* Facilities Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-[#606C38]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#283618]"></div>
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200/80 shadow-sm">
          <Building2 size={40} className="mx-auto text-stone-400 mb-3" />
          <h3 className="text-base font-semibold text-[#283618]">No facilities found</h3>
          <p className="text-sm text-stone-500 mt-1">Get started by clicking the "Add Facility" button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((facility) => (
            <div 
              key={facility.id} 
              className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-[#283618] leading-tight">
                    {facility.name}
                  </h3>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    facility.ownership.toLowerCase() === 'public'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {facility.ownership}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-stone-400 shrink-0 mt-0.5" />
                    <span>{facility.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-stone-500">
                    <Navigation size={14} className="text-stone-400 shrink-0" />
                    <span>Lat: {facility.latitude}, Lng: {facility.longitude}</span>
                  </div>

                  {facility.operating_hours && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-stone-400 shrink-0" />
                      <span>{facility.operating_hours}</span>
                    </div>
                  )}

                  {facility.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-stone-400 shrink-0" />
                      <span>{facility.contact_number}</span>
                    </div>
                  )}
                </div>

                {facility.services && facility.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
                    {facility.services.map((service, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] bg-[#FEFAE0] text-[#283618] px-2 py-0.5 rounded font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-stone-100">
                <button
                  onClick={() => handleOpenModal(facility)}
                  className="flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-[#283618] p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(facility.id, facility.name)}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-[#283618]">
                {editingId ? 'Edit Facility' : 'Add New Facility'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 rounded-full p-1 hover:bg-stone-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-[#283618] mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carmona Rural Health Unit"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#283618] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                  >
                    <option value="Health Center">Health Center</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Diagnostic Center">Diagnostic Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#283618] mb-1">Ownership</label>
                  <select
                    value={formData.ownership}
                    onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#283618] mb-1">Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street, Barangay, Municipality"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#283618] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 14.316654"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#283618] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 121.056088"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#283618] mb-1">
                  Services (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="DOTS Providing Facility, GeneXpert, Sputum Test"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#283618] mb-1">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="8:00 AM - 5:00 PM"
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#283618] mb-1">Contact Number</label>
                  <input
                    type="text"
                    placeholder="(046) 123-4567"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#606C38]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-[#283618] hover:bg-[#606C38] text-white transition-colors shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}