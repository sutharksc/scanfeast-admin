import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { updateRestaurant } from "../store/slices/restaurantSlice";
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  GlobeIcon,
  CameraIcon,
  CheckCircleIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
  CurrencyDollarIcon,
  UsersIcon,
  StarIcon,
  TruckIcon,
  CreditCardIcon,
} from "../components/ui/Icons";
import { lookupService, States } from "../services/lookupService";
import { setStates } from "../store/slices/stateSlice";
import { Building2, ChartBarBig, Landmark, StickyNote } from "lucide-react";
import { restaurentService } from "../services/restaurentService";
import { useAuth } from "../hooks/useAuth";

const Restaurant: React.FC = () => {
  const { restaurant } = useSelector((state: RootState) => state.restaurant);
  const dispatch = useDispatch<AppDispatch>();
  const states = useSelector((state: RootState) => state.states.data);
  const {user} = useAuth()

  const fetchStates = async () => {
    if (states == null) {
      const result = await lookupService.getStates();
      dispatch(setStates(result.data));
    }
  };

  const fetchRestaurentById = async () =>{
    if(restaurant != null) return;
    const result = await restaurentService.getRestaurentById(user.id)
    dispatch(updateRestaurant(result.data))
  }

  useEffect(() => {
    fetchRestaurentById();
  }, [restaurant]);

  useEffect(() => {
    fetchStates();
    console.log("states =>", states);
  }, [states]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    pinCode: "",
    landmark: "",
    stateId: 1,
    phone: "",
    email: "",
    website: "",
    cuisine: "",
    priceRange: "",
    openingHours: {
      monday: "9:00 AM - 10:00 PM",
      tuesday: "9:00 AM - 10:00 PM",
      wednesday: "9:00 AM - 10:00 PM",
      thursday: "9:00 AM - 10:00 PM",
      friday: "9:00 AM - 11:00 PM",
      saturday: "9:00 AM - 11:00 PM",
      sunday: "10:00 AM - 9:00 PM",
    },
    deliveryFee: 5.99,
    minimumOrder: 15.0,
    estimatedDeliveryTime: "30-45 min",
    paymentMethods: ["cash", "card", "online"],
    features: ["delivery", "pickup", "dine-in"],
    socialMedia: {
      facebookLink: "",
      instagramLink: "",
      twitterLink: "",
    },
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        city: restaurant.city,
        pinCode: restaurant.pinCode,
        stateId: restaurant.stateId,
        landmark: restaurant.landmark,
        website: restaurant.website || "",
        cuisine: restaurant.cuisine || "",
        priceRange: restaurant.priceRange || "",
        openingHours: restaurant.openingHours || formData.openingHours,
        deliveryFee: restaurant.deliveryFee || 5.99,
        minimumOrder: restaurant.minimumOrder || 15.0,
        estimatedDeliveryTime: restaurant.estimatedDeliveryTime || "30-45 min",
        paymentMethods: restaurant.paymentMethods || ["cash", "card", "online"],
        features: restaurant.features || ["delivery", "pickup", "dine-in"],
        socialMedia: restaurant.socialMedia || formData.socialMedia,
      });
      setLogoPreview(restaurant.logo || "");
      setCoverPreview(restaurant.coverImage || "");
    }
  }, [restaurant]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const updatedRestaurant:any = {
    //   ...formData,
    //   logo: logoPreview,
    //   coverImage: coverPreview,
    //   updatedAt: new Date().toISOString(),
    // };
    const updatedRestaurant = {
  id: restaurant.id,
  name: formData.name,
  description: formData.description,
  userName: restaurant.userName,
  logoURL: logoPreview,
  bannerURL: coverPreview,
  address: formData.address,
  landmark: formData.landmark,
  priceRange: formData.priceRange,
  contactNumber: formData.phone,
  email: formData.email,
  website: formData.website,
  city: formData.city,
  pinCode: formData.pinCode,
  stateId: formData.stateId,
  totalReviews: 0,
  avgReviews: 0,
  socialMedia: {
    facebookLink: formData.socialMedia.facebookLink,
    instagramLink: formData.socialMedia.instagramLink,
    twitterLink: formData.socialMedia.twitterLink
  },
  openingHours: {
    monday: formData.openingHours.monday,
    tuesday: formData.openingHours.tuesday,
    wednesday: formData.openingHours.wednesday,
    thursday: formData.openingHours.thursday,
    friday: formData.openingHours.friday,
    saturday: formData.openingHours.saturday,
    sunday: formData.openingHours.sunday
  }
};


    await restaurentService.update(updatedRestaurant)
    dispatch(updateRestaurant(updatedRestaurant));
    setIsEditing(false);
  };

  // Handle file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle payment method
  const togglePaymentMethod = (method: string) => {
    setFormData({
      ...formData,
      paymentMethods: formData.paymentMethods.includes(method)
        ? formData.paymentMethods.filter((m) => m !== method)
        : [...formData.paymentMethods, method],
    });
  };

  // Toggle feature
  const toggleFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.includes(feature)
        ? formData.features.filter((f) => f !== feature)
        : [...formData.features, feature],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Restaurant Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your restaurant information and settings
          </p>
        </div>

        <div className="flex space-x-3 mt-4 sm:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl overflow-hidden">
        {coverPreview ? (
          <img
            src={coverPreview}
            alt="Restaurant Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BuildingStorefrontIcon className="w-24 h-24 text-white/50" />
          </div>
        )}

        {isEditing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors">
              <CameraIcon className="w-4 h-4 mr-2" />
              Change Cover
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingStorefrontIcon className="w-5 h-5 mr-2 text-orange-500" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Restaurant Logo"
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                      <BuildingStorefrontIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 cursor-pointer">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                        <CameraIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-orange-500 outline-none"
                      placeholder="Restaurant Name"
                    />
                  ) : (
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formData.name || "Restaurant Name"}
                    </h3>
                  )}

                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>4.5 (234 reviews)</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      <span>{formData.priceRange || "$$"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe your restaurant..."
                  />
                ) : (
                  <p className="text-gray-600">
                    {formData.description || "No description available."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PhoneIcon className="w-5 h-5 mr-2 text-orange-500" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="123 Main St, City, State"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.address || "No address provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="eg. Ahmedabad,Mumbai etc"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.city || "No city provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Landmark
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) =>
                      setFormData({ ...formData, landmark: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="eg. near SBI Bank"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Landmark className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.landmark || "No landmark provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Pin Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) =>
                      setFormData({ ...formData, pinCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="eg. 000000"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <StickyNote className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.pinCode || "No pincode provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  State
                </label>
                {isEditing ? (
                  <select
                    value={formData.stateId}
                    onChange={(e) =>
                      setFormData({ ...formData, stateId: +e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0">Select</option>
                    {states?.map((state: States) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center text-gray-900">
                    <ChartBarBig className="w-4 h-4 mr-2 text-gray-400" />
                    {states?.find((x) => x.id === formData.stateId)?.name ||
                      "No state selected"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.phone || "No phone provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="contact@restaurant.com"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.email || "No email provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://restaurant.com"
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <GlobeIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {formData.website ? (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        {formData.website}
                      </a>
                    ) : (
                      "No website provided"
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-orange-500" />
              Opening Hours
            </h2>

            <div className="space-y-3">
              {Object.entries(formData.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingHours: {
                            ...formData.openingHours,
                            [day]: e.target.value,
                          },
                        })
                      }
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="9:00 AM - 10:00 PM"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{hours}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  ${formData.deliveryFee.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Min. Order</span>
                <span className="font-semibold text-gray-900">
                  ${formData.minimumOrder.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Delivery Time</span>
                <span className="font-semibold text-gray-900">
                  {formData.estimatedDeliveryTime}
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Services
            </h2>

            <div className="space-y-3">
              {["delivery", "pickup", "dine-in"].map((feature) => (
                <label
                  key={feature}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    disabled={!isEditing}
                    className="mr-3 text-orange-600 focus:ring-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {feature === "delivery" && (
                      <TruckIcon className="w-4 h-4 mr-1 inline" />
                    )}
                    {feature === "pickup" && (
                      <UsersIcon className="w-4 h-4 mr-1 inline" />
                    )}
                    {feature === "dine-in" && (
                      <BuildingStorefrontIcon className="w-4 h-4 mr-1 inline" />
                    )}
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Methods
            </h2>

            <div className="space-y-3">
              {[
                { value: "cash", label: "Cash", icon: CurrencyDollarIcon },
                { value: "card", label: "Card", icon: CreditCardIcon },
                { value: "online", label: "Online", icon: GlobeIcon },
              ].map((method) => (
                <label
                  key={method.value}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.includes(method.value)}
                    onChange={() => togglePaymentMethod(method.value)}
                    disabled={!isEditing}
                    className="mr-3 text-orange-600 focus:ring-orange-500 rounded"
                  />
                  <method.icon className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {method.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Social Media
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Facebook
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.socialMedia.facebookLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          facebookLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="@restaurant"
                  />
                ) : (
                  <span className="text-sm text-gray-600">
                    {formData.socialMedia.facebookLink || "Not provided"}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Instagram
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.socialMedia.instagramLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          instagramLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="@restaurant"
                  />
                ) : (
                  <span className="text-sm text-gray-600">
                    {formData.socialMedia.instagramLink || "Not provided"}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Twitter
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.socialMedia.twitterLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          twitterLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="@restaurant"
                  />
                ) : (
                  <span className="text-sm text-gray-600">
                    {formData.socialMedia.twitterLink || "Not provided"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
