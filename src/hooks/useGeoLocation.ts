import { useState, useEffect } from 'react';

// List of allowed US states (Mocked for now, real implementation would use IP API)
// In a real app, this would be a server-side check.
export const ALLOWED_REGIONS = ['US'];

export function useGeoLocation() {
    const [country, setCountry] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRestricted, setIsRestricted] = useState(false);

    useEffect(() => {
        const checkLocation = async () => {
            try {
                setLoading(true);
                // MOCK: Default to 'US' for development so it works.
                // Change this to 'CA' or 'UK' to test the restricted view.
                const mockCountry = 'US';

                // Real implementation example:
                // const res = await fetch('https://ipapi.co/json/');
                // const data = await res.json();
                // const mockCountry = data.country_code;

                setCountry(mockCountry);

                if (!ALLOWED_REGIONS.includes(mockCountry)) {
                    setIsRestricted(true);
                } else {
                    setIsRestricted(false);
                }
            } catch (error) {
                console.error("Geo check failed", error);
                // Fail safe: Allow or Block? Usually block for compliance.
                // For dev, we allow.
                setIsRestricted(false);
            } finally {
                setLoading(false);
            }
        };

        checkLocation();
    }, []);

    return { country, isRestricted, loading };
}
