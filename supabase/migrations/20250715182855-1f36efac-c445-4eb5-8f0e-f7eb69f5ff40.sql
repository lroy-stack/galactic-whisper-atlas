-- Create galactic_systems table
CREATE TABLE public.galactic_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  region TEXT NOT NULL,
  grid_coordinates TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.galactic_systems ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access for galactic_systems" 
ON public.galactic_systems 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_galactic_systems_updated_at
BEFORE UPDATE ON public.galactic_systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.galactic_systems (name, sector, region, grid_coordinates) VALUES
('2GS-91E20', 'Core Worlds', 'Core Worlds', 'M-11'),
('A-Foroon', 'Arkanis', 'Outer Rim Territories', 'R-16'),
('Aaeton', 'Core Worlds', 'Core Worlds', 'K-9'),
('Aakaash', 'Oplovis', 'Outer Rim Territories', 'M-5'),
('Aaloth', 'Gaulus', 'Outer Rim Territories', 'S-17'),
('Aar', 'Nijune', 'Outer Rim Territories', 'N-5'),
('Aargau', 'Core Worlds', 'Core Worlds', 'L-10'),
('Aargonar', 'Perkell', 'Mid Rim', 'Q-7'),
('Aaris', 'Kathol', 'Outer Rim Territories', 'M-21'),
('Aaron', 'Tharin', 'Outer Rim Territories', 'S-8'),
('Ab Dalis', 'Gaulus', 'Outer Rim Territories', 'R-17'),
('Ab''Bshingh', 'Sujimis', 'Outer Rim Territories', 'O-19'),
('Abaarian', 'Abaar', 'Mid Rim', 'K-7'),
('Abafar', 'Quelii', 'Outer Rim Territories', 'O-6'),
('Abar', 'Tragan Cluster', 'Outer Rim Territories', 'N-5'),
('Abbaji', 'Zuma (Spar)', 'Outer Rim Territories', 'H-16'),
('Abecederia', 'Noolian', 'Mid Rim', 'Q-13'),
('Abednedo', 'Colonies', 'Colonies', 'N-12'),
('Abelor', 'Yushan', 'Mid Rim', 'K-17'),
('Abersyn', 'Cyrillian Protectorate', 'Expansion Region', 'O-12'),
('Abhean', 'Maldrood', 'Mid Rim', 'R-7'),
('Abo Dreth', 'Corporate Sector', 'Outer Rim Territories', 'S-3'),
('Abonshee', 'Fakir', 'Colonies', 'K-9'),
('Abraxas', 'Yushan', 'Mid Rim', 'K-17'),
('Abraxin', 'Tion Hegemony', 'Outer Rim Territories', 'S-6'),
('Abregado', 'Core Worlds', 'Core Worlds', 'K-13'),
('Abridon', 'Koradin', 'Outer Rim Territories', 'J-18'),
('Abrihom', 'Rayter', 'Outer Rim Territories', 'J-19'),
('Abrion Major', 'Abrion', 'Outer Rim Territories', 'S-15'),
('Absanz', 'Allied Tion', 'Outer Rim Territories', 'S-6'),
('Absit', 'Tunka', 'Outer Rim Territories', 'I-19'),
('Abyss', 'Ash Worlds', 'Outer Rim Territories', 'S-7'),
('Ac''fren', 'Calaron', 'Outer Rim Territories', 'T-9'),
('Acachla', 'Colonies', 'Colonies', 'N-10'),
('Achillea', 'Tapani', 'Colonies', 'L-13'),
('Acomber', 'Colonies', 'Colonies', 'M-9'),
('Actlyon', 'Jjannex', 'Outer Rim Territories', 'K-19'),
('Adalog', 'Mytaranor', 'Mid Rim', 'Q-10'),
('Adamastor', 'Core Worlds', 'Core Worlds', 'L-9'),
('Adana', 'Deep Core', 'Deep Core', 'L-10'),
('Adari', 'Adari', 'Inner Rim', 'M-9'),
('Adarlon', 'Minos Cluster', 'Outer Rim Territories', 'M-20'),
('Adelphi', 'Kibilini', 'Outer Rim Territories', 'P-17'),
('Adikaria', 'Core Worlds', 'Core Worlds', 'K-12'),
('Adim', 'Adari', 'Inner Rim', 'M-9'),
('Adin', 'Lostar', 'Expansion Region', 'M-7'),
('Adinax Nebula', 'Semagi', 'Mid Rim', 'I-16'),
('Adner', 'Yataga', 'Expansion Region', 'N-16'),
('Adoris', 'Senex', 'Mid Rim', 'L-17'),
('Adras', 'Seswenna', 'Outer Rim Territories', 'M-17'),
('Adratharpe', 'Mid Rim', 'Mid Rim', 'H-15'),
('Adrathorpe', 'Wild Space', 'Wild Space', 'I-11'),
('Aduba', 'Bheriz', 'Outer Rim Territories', 'U-11'),
('Adumar', 'Wild Space', 'Wild Space', 'J-6'),
('Aefao', 'Corosi', 'Outer Rim Territories', 'N-5'),
('Aeneid', 'Kessel', 'Outer Rim Territories', 'T-10'),
('Aeos', 'Chopani', 'Outer Rim Territories', 'M-3'),
('Aesolian', 'Wild Space', 'Wild Space', 'I-15'),
('Aestilan', 'Demetras', 'Outer Rim Territories', 'P-7'),
('Aeten', 'Wild Space', 'Wild Space', 'J-6'),
('Affa', 'Inner Rim', 'Inner Rim', 'M-13'),
('Affadar', 'Fellwe', 'Expansion Region', 'L-8'),
('Affavan', 'Hutt Space', 'Hutt Space', 'S-12'),
('Agamar', 'Lahara', 'Outer Rim Territories', 'M-5'),
('Agaris', 'Wild Space', 'Wild Space', 'G-14'),
('Agash', 'Great Agash', 'Expansion Region', 'K-15'),
('Agoliba-Tu', 'Veragi', 'Outer Rim Territories', 'K-3'),
('Agomar', 'Seswenna', 'Outer Rim Territories', 'M-18'),
('Agon', 'Ash Worlds', 'Outer Rim Territories', 'T-7'),
('Agora', 'Sluis', 'Outer Rim Territories', 'M-19'),
('Agridorn', 'Colonies', 'Colonies', 'N-12'),
('Agriworld-2079', 'M''shinni', 'Mid Rim', 'L-7'),
('Aguarl', 'Mbandamonte', 'Expansion Region', 'N-15'),
('Ahakista', 'Myto', 'Outer Rim Territories', 'K-3'),
('Ahch-To', 'Unknown Regions', 'Unknown Regions', 'F-13'),
('Ahn Krantarium', 'Esuain', 'Mid Rim', 'P-7'),
('Ai''ken Prime', 'Inner Rim', 'Inner Rim', 'O-10'),
('Aida', 'Aida', 'Mid Rim', 'Q-13'),
('Aikhibba', 'Fei Hu', 'Mid Rim', 'P-13'),
('Ailon', 'Inner Rim', 'Inner Rim', 'N-12'),
('Aiqin', 'Airam', 'Outer Rim Territories', 'L-20'),
('Ajan Kloss', 'Cademimu', 'Outer Rim Territories', 'L-5'),
('Ak-Hurst', 'Tarabba', 'Outer Rim Territories', 'M-19'),
('Akiva', 'Meerian', 'Outer Rim Territories', 'O-6'),
('Akkadese Maelstrom', 'Kessel', 'Outer Rim Territories', 'T-10'),
('Akrit''tar', 'Calaron', 'Outer Rim Territories', 'T-9'),
('Akuria', 'Oplovis', 'Outer Rim Territories', 'M-5'),
('Al''doleem', 'Hune', 'Mid Rim', 'Q-12'),
('Alabash', 'Fakir', 'Colonies', 'K-9'),
('Alagon', 'Tennuutta', 'Mid Rim', 'Q-7'),
('Alakatha', 'Var Hagen', 'Mid Rim', 'M-16'),
('Alamass', 'Calaron', 'Outer Rim Territories', 'T-9'),
('Alarevi', 'Gaulus', 'Outer Rim Territories', 'S-17'),
('Alashan', 'Wild Space', 'Wild Space', 'J-5'),
('Alaspin', 'Suolriep', 'Outer Rim Territories', 'S-8'),
('Alassa Major', 'Vilonis', 'Mid Rim', 'O-16'),
('Alba', 'Belsmuth', 'Outer Rim Territories', 'O-6'),
('Albarrio', 'Albarrio', 'Outer Rim Territories', 'K-5'),
('Albecus', 'Core Worlds', 'Core Worlds', 'L-9'),
('Albrae-Don', 'Sern', 'Colonies', 'L-13'),
('Alchenaut', 'Alchenaut', 'Expansion Region', 'L-16'),
('Alderaan', 'Alderaan', 'Core Worlds', 'M-10');