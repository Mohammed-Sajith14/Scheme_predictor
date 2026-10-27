/**
 * Returns a unique, high-quality, authentic image URL specific to each Indian government scheme.
 */
export const getSchemeImageUrl = (category: string, name: string, schemeId?: number, customImageUrl?: string): string => {
  if (customImageUrl && customImageUrl.trim().length > 0) {
    return customImageUrl.trim();
  }
  const cat = (category || '').toLowerCase();
  const nm = (name || '').toLowerCase();
  
  // Specific match by scheme name keywords or ID
  if (nm.includes('post matric') || nm.includes('post-matric')) {
    // Higher education students in college library/classroom
    return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('pm-kisan') || nm.includes('kisan samman')) {
    // Authentic Indian farmer in green agricultural fields
    return 'https://images.unsplash.com/photo-1595275372297-f51b4efb07a5?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('rozgar') || nm.includes('pmry')) {
    // Micro-entrepreneur in small business workshop
    return 'https://images.unsplash.com/photo-1556742049-0a67daf64f42?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('old age') || nm.includes('senior')) {
    // Smiling Indian senior citizen elder
    return 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('disability') || nm.includes('differently')) {
    // Healthcare & accessibility care support
    return 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('awas') || nm.includes('housing')) {
    // Pucca rural brick house under construction
    return 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('widow')) {
    // Resilient Indian woman in community setting
    return 'https://images.unsplash.com/photo-1609139324428-0cd1144a374b?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('mgnrega') || nm.includes('job card')) {
    // Rural infrastructure earthwork community labor
    return 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('magalir') || nm.includes('urimai')) {
    // Tamil Nadu women empowerment self-help group
    return 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('fellowship') || nm.includes('chief minister fellowship')) {
    // Young scholars & policy research fellows collaborating
    return 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('stand-up') || nm.includes('stand up')) {
    // Female & SC/ST commercial startup entrepreneur
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('svanidhi') || nm.includes('street vendor')) {
    // Indian street market vendor at retail cart
    return 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('matsya') || nm.includes('pmmsy') || nm.includes('fisheries')) {
    // Indian fishermen with fishing boats & nets at harbor
    return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('central sector scholarship') || (cat.includes('education') && nm.includes('higher'))) {
    // University students collaborating in modern campus setting
    return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800';
  }
  if (nm.includes('grameen kaushalya') || nm.includes('ddu-gky') || nm.includes('kaushalya')) {
    // Youth in vocational technical skill training workshop
    return 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800';
  }

  // Category fallback with unique images per category
  if (cat.includes('education') || nm.includes('scholarship') || nm.includes('student')) {
    return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800';
  }
  if (cat.includes('agriculture') || nm.includes('farmer') || nm.includes('crop')) {
    return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800';
  }
  if (cat.includes('housing') || nm.includes('home')) {
    return 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=800';
  }
  if (cat.includes('employment') || cat.includes('business') || nm.includes('skill')) {
    return 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=800';
  }
  if (cat.includes('women')) {
    return 'https://images.unsplash.com/photo-1609139324428-0cd1144a374b?auto=format&fit=crop&q=80&w=800';
  }
  if (cat.includes('disability') || nm.includes('health')) {
    return 'https://images.unsplash.com/photo-1606201450503-a15d0b9e875a?auto=format&fit=crop&q=80&w=800';
  }
  
  // Universal fallback: Indian citizen gov-tech
  return '/indian_citizen_gov_tech.jpg';
};

