// src/utils/profileUtils.ts

import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { PostgrestSingleResponse } from '@supabase/supabase-js'; // Import necessary type

// Funktion, um einen Timeout für eine Promise zu erstellen
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError = new Error('Operation timed out')): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(timeoutError), ms))
  ]);
}

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
    console.log('Executing Supabase query to fetch profile with timeout...');

    // Timeout von 10 Sekunden (10000 ms) für die Abfrage
    // Wrap the Supabase query builder with Promise.resolve() to get a standard Promise
    const result = await withTimeout(
      Promise.resolve( // Wrap the builder with Promise.resolve
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
      ) as Promise<PostgrestSingleResponse<any>>, // Explicitly type the resolved promise for the timeout
      10000, // 10 Sekunden Timeout
      new Error(`fetchProfile timed out after 10 seconds for user: ${userId}`)
    );

    // Wenn der Timeout nicht ausgelöst wurde, verarbeiten wir das Ergebnis
    // result hat data und error properties von Supabase Response
    const { data: existingProfile, error: fetchError } = result;


    console.log('Supabase query executed (via timeout wrapper).');
    console.log('Supabase query result - data:', existingProfile);
    console.error('Supabase query result - error:', fetchError);


    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      console.error('Details of fetch error:', JSON.stringify(fetchError, null, 2));
      return null;
    }

    if (existingProfile) {
      console.log('Existing profile found:', existingProfile);
      console.log('Details of fetched profile:', JSON.stringify(existingProfile, null, 2));
      return existingProfile;
    }

    console.log('No existing profile found for user:', userId);
    return null;

  } catch (err) {
    console.error('Error in fetchProfile (caught by try/catch or timeout):', err);
    // Zusätzliches Logging des Fehlers, einschließlich Timeout-Fehler
    // Check if the error is a timeout error
    if (err instanceof Error && err.message.startsWith('fetchProfile timed out')) {
        console.error('Caught a timeout error in fetchProfile.');
    }
    console.error('Details of caught error in fetchProfile:', JSON.stringify(err, null, 2));
    return null;
  }
};