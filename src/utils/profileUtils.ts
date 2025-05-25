
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export const createProfile = async (userId: string, userData: any, session: Session | null) => {
  console.log('Creating profile for user:', userId, userData);
  
  const profileData = {
    id: userId,
    name: userData.name || userData.full_name || session?.user?.email?.split('@')[0] || 'Unbekannt',
    email: session?.user?.email || '',
    role: userData.role || 'student'
  };

  try {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }
    
    console.log('Profile created successfully:', newProfile);
    return newProfile;
  } catch (err) {
    console.error('Error in createProfile:', err);
    return null;
  }
};

export const fetchProfile = async (userId: string) => {
  console.log('Fetching profile for user:', userId);
  
  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return null;
    }
    
    if (existingProfile) {
      console.log('Existing profile found:', existingProfile);
      return existingProfile;
    }
    
    return null;
    
  } catch (err) {
    console.error('Error in fetchProfile:', err);
    return null;
  }
};
