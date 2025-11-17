interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface SocialMedia {
  facebookLink: string;
  instagramLink: string;
  twitterLink: string;
}

export interface Restaurant {
  name: string;
  description: string;
  address: string;
  city: string;
  pinCode: string;
  landmark: string;
  stateId: number;
  phone: string;
  email: string;
  website: string;
  cuisine: string;
  priceRange: string;
  totalReviews:number;
  avgReviews:number;
  openingHours: OpeningHours;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: string;
  paymentMethods: string[];
  features: string[];
  socialMedia: SocialMedia;
}