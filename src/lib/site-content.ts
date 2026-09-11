import weddingHero from "@/assets/wedding-hero.jpg";
import preweddingDusk from "@/assets/prewedding-dusk.jpg";
import ringsDetail from "@/assets/rings-detail.jpg";
import receptionNight from "@/assets/reception-night.jpg";
import serviceWedding from "@/assets/service-wedding.jpg";
import serviceProduct from "@/assets/service-product.jpg";

export const contactDetails = {
  whatsapp: "+91 98765 43210",
  whatsappHref: "https://wa.me/919876543210",
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "hello@vessel.studio",
  emailHref: "mailto:hello@vessel.studio",
};

export const services = [
  {
    number: "01",
    title: "Wedding Photography & Filming",
    description: "Full-day coverage, edited stills and a cinematic edit shaped around your people.",
    image: serviceWedding,
    alt: "Wedding ceremony aisle in warm morning light",
  },
  {
    number: "02",
    title: "Pre-Wedding Photography & Filming",
    description: "A relaxed, location-led session that gives your story room to become itself.",
    image: preweddingDusk,
    alt: "Couple standing together at dusk beside the sea",
  },
  {
    number: "03",
    title: "Baby & Kids Photography",
    description: "The small years, held with patience, natural light and plenty of room to play.",
    image: ringsDetail,
    alt: "Soft close detail of hands in warm light",
  },
  {
    number: "04",
    title: "Product Photography",
    description: "Clean, considered imagery for brands that value craft and a human point of view.",
    image: serviceProduct,
    alt: "Minimal product still life in warm studio light",
  },
  {
    number: "05",
    title: "Corporate Photography & Filming",
    description: "Events, launches and brand films with an editorial eye and dependable delivery.",
    image: serviceWedding,
    alt: "Guests gathered inside a bright wedding venue",
  },
  {
    number: "06",
    title: "Event Photography & Filming",
    description: "Private and public moments, photographed with energy and delivered without fuss.",
    image: receptionNight,
    alt: "Guests dancing beneath warm string lights",
  },
] as const;

export const portfolio = [
  { category: "Weddings", title: "The Ceremony", location: "Alibaug · 2025", image: serviceWedding, alt: "Wedding ceremony framed by guests" },
  { category: "Weddings", title: "Golden Hour", location: "Udaipur · 2025", image: weddingHero, alt: "Bride in a flowing dress at golden hour" },
  { category: "Pre-Weddings", title: "Before The Vows", location: "Goa · 2025", image: preweddingDusk, alt: "Couple silhouetted against a coastal sunset" },
  { category: "Pre-Weddings", title: "The In-Between", location: "Lonavala · 2024", image: weddingHero, alt: "Bride walking through a sunlit landscape" },
  { category: "Products", title: "Quiet Objects", location: "Mumbai · 2025", image: serviceProduct, alt: "Minimal perfume bottle on a studio set" },
  { category: "Events", title: "After Dark", location: "Delhi · 2024", image: receptionNight, alt: "Guests dancing at a night reception" },
  { category: "Corporate", title: "The Gathering", location: "Bengaluru · 2024", image: serviceWedding, alt: "Audience gathered in a bright venue" },
  { category: "Baby & Kids", title: "The Little Years", location: "Pune · 2024", image: ringsDetail, alt: "A warm close-up detail in soft light" },
] as const;

export const films = [
  {
    title: "Amara & Ravi — Kerala",
    description: "A three-day celebration across a working spice farm.",
    duration: "03:12",
    image: weddingHero,
    videoId: "ScMzIvxBSi4",
  },
  {
    title: "Lena & Marco — Tuscany",
    description: "An elopement told entirely in long, quiet takes.",
    duration: "02:48",
    image: preweddingDusk,
    videoId: "aqz-KE-bpKQ",
  },
  {
    title: "Priya & Dev — Jaipur",
    description: "A palace reception cut to the beat of the night.",
    duration: "04:05",
    image: receptionNight,
    videoId: "dQw4w9WgXcQ",
  },
] as const;

export const categories = ["All", "Weddings", "Pre-Weddings", "Baby & Kids", "Products", "Corporate", "Events"] as const;