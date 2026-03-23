import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiNavigation } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const OFFICE_ICONS = {
  'VAO Office': '🏛',
  'Revenue Inspector Office': '📋',
  'Taluk Office': '🏢',
  'Sub Registrar Office': '📝',
  'District Court': '⚖️',
  'Police Station': '🚔',
  'District Collectorate': '🏛',
  'RTO Office': '🚗',
  'Municipality Office': '🏢',
  'Consumer Court': '🛍️',
  'Labour Court': '👷',
};

const NearbyOfficesSidebar = ({ query, response, location, isOpen, onClose, isLocationEnabled }) => {
  const { t } = useTranslation();

  // ── Compute offices REACTIVELY from query + AI response ──────────────────
  const offices = React.useMemo(() => {
    if (!isLocationEnabled || !location || !location.lat || !location.lng) return [];
    
    const lat = location.lat;
    const lng = location.lng;
    const combinedText = ((query || '') + ' ' + (response || '')).toLowerCase();

    const buildOffice = (label, searchName) => ({
      label,
      mapsSearchUrl: `https://www.google.com/maps/search/${encodeURIComponent(searchName)}/@${lat},${lng},15z`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(searchName)}&travelmode=driving`,
    });

    const rules = [
      { label: 'VAO Office', searchName: 'VAO office', kw: ['vao', 'village', 'nativity', 'community', 'income', 'patta', 'chitta', 'land', 'vivasayam', 'jaathi', 'family', 'ration', 'villangam'] },
      { label: 'Revenue Inspector Office', searchName: 'Revenue Inspector office', kw: ['revenue inspector', 'ri office', 'patta transfer', 'mutation', 'survey', 'surveyor'] },
      { label: 'Taluk Office', searchName: 'Taluk Office', kw: ['taluk', 'tahsildar', 'thasildar', 'certificate', 'obc', 'mbc', 'sc', 'st', 'bc', 'legal heir', 'domicile', 'certificates'] },
      { label: 'Sub Registrar Office', searchName: 'Sub Registrar Office', kw: ['sub registrar', 'property', 'sale deed', 'marriage', 'registration', 'encumbrance', 'ec', 'stamp duty', 'registrations'] },
      { label: 'District Court', searchName: 'District Court', kw: ['district court', 'court', 'case', 'lawsuit', 'bail', 'judge', 'advocate', 'lawyer', 'divorce', 'legal notice', 'litigation', 'justice'] },
      { label: 'Police Station', searchName: 'Police Station', kw: ['police', 'fir', 'complaint', 'theft', 'robbery', 'accident', 'fraud', 'missing', 'arrest', 'crime', 'pc', 'stations'] },
      { label: 'District Collectorate', searchName: 'District Collectorate', kw: ['collectorate', 'collector', 'grievance', 'rti', 'relief', 'dm office', 'complaints'] },
      { label: 'RTO Office', searchName: 'RTO office', kw: ['rto', 'driving licence', 'vehicle', 'registration', 'dl', 'rc book', 'transport', 'license'] },
      { label: 'Municipality Office', searchName: 'Municipality Office', kw: ['municipality', 'corporation', 'birth certificate', 'death certificate', 'property tax', 'water tax', 'certificate'] },
      { label: 'Consumer Court', searchName: 'Consumer Court', kw: ['consumer', 'fraud', 'product', 'service', 'compensation', 'complaint', 'grievance'] },
      { label: 'Labour Court', searchName: 'Labour Court', kw: ['labour', 'worker', 'employment', 'salary', 'pf', 'esi', 'dismissal', 'workers'] },
    ];

    const matched = [];
    const seen = new Set();
    
    // 1. First, find SPECIFIC match from query/response keywords
    for (const rule of rules) {
      if (rule.kw.some(k => combinedText.includes(k))) {
        seen.add(rule.label);
        matched.push(buildOffice(rule.label, rule.searchName));
      }
    }

    // 2. IMMEDIATE FEEDBACK: If fewer than 4 offices match, fill with general legal offices
    // This ensures that clicking the location icon IMMEDIATELY shows directions
    // without waiting for a question.
    const defaults = [
      { label: 'Taluk Office', searchName: 'Taluk Office' },
      { label: 'Police Station', searchName: 'Police Station' },
      { label: 'District Court', searchName: 'District Court' },
      { label: 'VAO Office', searchName: 'VAO office' },
    ];
    
    for (const d of defaults) {
      if (matched.length >= 4) break;
      if (!seen.has(d.label)) {
        seen.add(d.label);
        matched.push(buildOffice(d.label, d.searchName));
      }
    }

    return matched.slice(0, 4);
  }, [query, response, location, isLocationEnabled]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="nearby-offices-sidebar"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed right-0 top-0 h-full w-[300px] bg-sidebar border-l border-border flex flex-col z-50 shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <FiMapPin className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary">Nearby Offices</h2>
                <p className="text-xs text-text-secondary">Get directions instantly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!isLocationEnabled ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl">
                  📍
                </div>
                <p className="text-sm font-medium text-text-primary">Location not enabled</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Enable your location using the button in the chat to see nearby offices.
                </p>
              </div>
            ) : offices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl">
                  🏛️
                </div>
                <p className="text-sm font-semibold text-text-primary">No Nearby Offices</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Ask a legal question (e.g. community certificate, FIR, property registration) to see relevant offices near you.
                </p>
                <div className="mt-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs text-accent font-medium">📍 Location is active</p>
                  <p className="text-xs text-text-secondary mt-0.5">Offices will appear after your question</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-secondary px-1 pb-1">
                  {offices.length} office{offices.length > 1 ? 's' : ''} found near you
                </p>
                {offices.map((office, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    className="group rounded-xl border border-border bg-ai-message hover:border-accent/40 transition-all p-4 shadow-sm"
                  >
                    {/* Office name */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">
                        {OFFICE_ICONS[office.label] || '🏢'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                          {office.label}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">Tap for directions</p>
                      </div>
                    </div>

                    {/* Directions Button */}
                    <a
                      href={office.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all active:scale-95 shadow-md"
                    >
                      <FiNavigation className="w-4 h-4" />
                      Get Directions
                    </a>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="p-3 border-t border-border mt-auto">
            <p className="text-center text-[10px] text-text-secondary opacity-70">
              🗺️ Opens in Google Maps with driving route
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default NearbyOfficesSidebar;
