import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, MapPin, Phone } from 'lucide-react';
import { toast } from '@/hooks/useToastMessage';
import { NewPatientForm } from '@/components/patients/NewPatientForm';

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    let query = supabase.from('patients').select('*').order('vezeteknev');
    
    if (searchTerm) {
      // Simplified search over name fields
      query = query.or(`vezeteknev.ilike.%${searchTerm}%,keresztnev.ilike.%${searchTerm}%,taj_szam.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Hiba a páciensek lekérdezésekor');
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  if (showAddForm) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <NewPatientForm 
          onCancel={() => setShowAddForm(false)} 
          onSuccess={() => {
            setShowAddForm(false);
            fetchPatients();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Páciensek</h1>
          <p className="text-muted-foreground">Páciensek kezelése és ambuláns lapok rögzítése.</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Új Páciens
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Keresés név vagy TAJ alapján..." 
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-muted-foreground p-4">Betöltés...</p>
        ) : patients.length === 0 ? (
          <p className="text-muted-foreground p-4 col-span-full">Nem található páciens.</p>
        ) : (
          patients.map(patient => (
            <Card 
              key={patient.id} 
              className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">
                      {patient.titulus ? `${patient.titulus} ` : ''}{patient.vezeteknev} {patient.keresztnev}
                    </h3>
                    {patient.taj_szam && <p className="text-sm text-muted-foreground mt-0.5">TAJ: {patient.taj_szam}</p>}
                  </div>
                </div>
                
                {/* Additional Patient Details Snippets */}
                <div className="text-xs text-muted-foreground space-y-1">
                  {patient.szuletesi_ido && (
                    <div>Szül: {patient.szuletesi_ido}</div>
                  )}
                  {patient.telefon_1_hivoszam && (
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1.5" />
                      +{patient.telefon_1_orszagkod} {patient.telefon_1_korzet} {patient.telefon_1_hivoszam}
                    </div>
                  )}
                  {patient.varos && (
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      {patient.iranyitoszam} {patient.varos}, {patient.utca_hazszam}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
