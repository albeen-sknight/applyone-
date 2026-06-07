export type OwnerProfile = {
  name: string;
  professionalName: string;
  location: string;
  workPermit: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  languages: string[];
  targetRoles: string[];
  targetMarket: string;
  preferredLanguage: string;
  education: string[];
  experience: string[];
  technicalSkills: string[];
  certifications: string[];
  projects: string[];
};

export async function getProfile(): Promise<OwnerProfile> {
  const response = await fetch("/api/profile");

  if (!response.ok) {
    throw new Error("No se pudo cargar el perfil.");
  }

  return response.json();
}
