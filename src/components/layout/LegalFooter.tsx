import { ShieldCheck } from 'lucide-react';

export function LegalFooter() {
    return (
        <footer className="mt-auto border-t border-white/5 bg-black/40 py-6 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-500">
                <div className="mb-4 flex items-center justify-center gap-2 text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-semibold">Secure & Regulated Skill Gaming</span>
                </div>
                <div className="space-y-2">
                    <p>
                        MUST BE 18+ TO PARTICIPATE. This is a skill-based competition platform.
                        Outcomes are determined by player skill, not chance.
                    </p>
                    <p>
                        Paid competitions are VOID WHERE PROHIBITED by law.
                        Users from AZ, AR, CT, DE, FL, LA, MD, MT, SC, SD, and TN are restricted from cash matches.
                    </p>
                    <p className="pt-2 text-gray-600">
                        &copy; 2026 FGC Money Match. All rights reserved. | Terms of Service | Privacy Policy
                    </p>
                </div>
            </div>
        </footer>
    );
}
