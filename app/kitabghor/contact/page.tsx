"use client";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  User,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F8F7]">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#0E4B4B] to-[#086666]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#F4F8F7] mb-4">
            আমাদের সাথে যোগাযোগ করুন
          </h1>
          <p className="text-xl text-[#F4F8F7]/90 max-w-2xl mx-auto">
            আপনার যেকোনো প্রশ্ন, মতামত বা সহায়তার জন্য আমরা এখানে আছি
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-[#F4F8F7]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D1414] mb-4">
              আমরা আপনার কথাগুলো শুনতে চাই
            </h2>
            <div className="w-24 h-1 bg-[#C0704D] mx-auto mb-4"></div>
            <p className="text-lg text-[#0D1414] max-w-2xl mx-auto">
              বই, অর্ডার, বা সাধারণ যেকোনো প্রশ্নে আমরা সাহায্য করতে প্রস্তুত
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[#5FA3A3] border-opacity-30">
              <div className="w-16 h-16 bg-[#0E4B4B] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-[#0E4B4B]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0D1414] mb-3">
                আমাদের ঠিকানা
              </h3>
              <p className="text-[#0D1414]">গ্রীন রোড, ঢাকা-১২১৫ বাংলাদেশ</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[#5FA3A3] border-opacity-30">
              <div className="w-16 h-16 bg-[#0E4B4B] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-[#0E4B4B]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0D1414] mb-3">
                ফোন করুন
              </h3>
              <p className="text-[#0D1414]">
                +88-01842781978
                <br />
                সকাল ৯টা - রাত ১০টা
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[#5FA3A3] border-opacity-30">
              <div className="w-16 h-16 bg-[#0E4B4B] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-[#0E4B4B]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0D1414] mb-3">
                ইমেইল করুন
              </h3>
              <p className="text-[#0D1414]">
                islamidawainstitute@gmail.com <br />
                atservice@birdsofeden.me
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[#5FA3A3] border-opacity-30">
              <div className="w-16 h-16 bg-[#0E4B4B] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[#0E4B4B]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0D1414] mb-3">
                কাজের সময়
              </h3>
              <p className="text-[#0D1414]">২৪/৭ অনলাইন অর্ডার</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#5FA3A3] border-opacity-30">
              <div className="flex items-center mb-6">
                <MessageCircle className="h-6 w-6 text-[#C0704D] mr-3" />
                <h3 className="text-2xl font-bold text-[#0D1414]">
                  মেসেজ পাঠান
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[#0D1414]"
                    >
                      আপনার নাম *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-[#5FA3A3]" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-[#5FA3A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C0704D] focus:border-transparent bg-[#F4F8F7]"
                        placeholder="আপনার পুরো নাম"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[#0D1414]"
                    >
                      ইমেইল ঠিকানা *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#5FA3A3]" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-[#5FA3A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C0704D] focus:border-transparent bg-[#F4F8F7]"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-[#0D1414]"
                  >
                    বিষয় *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 h-4 w-4 text-[#5FA3A3]" />
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-[#5FA3A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C0704D] focus:border-transparent bg-[#F4F8F7]"
                      placeholder="মেসেজের বিষয়"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-[#0D1414]"
                  >
                    আপনার মেসেজ *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#5FA3A3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C0704D] focus:border-transparent bg-[#F4F8F7] resize-none"
                    placeholder="আপনার মেসেজটি এখানে লিখুন..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#C0704D] hover:bg-[#A85D3F] text-[#F4F8F7] font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>মেসেজ পাঠান</span>
                </Button>
              </form>
            </div>

            {/* FAQ & Additional Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#5FA3A3] border-opacity-30">
                <h3 className="text-2xl font-bold text-[#0D1414] mb-6">
                  দ্রুত জরুরী তথ্য
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-[#F4F8F7] rounded-lg border-l-4 border-[#C0704D]">
                    <h4 className="font-semibold text-[#0D1414] mb-2">
                      অর্ডার সম্পর্কিত প্রশ্ন
                    </h4>
                    <p className="text-sm text-[#0D1414]">
                      আপনার অর্ডার স্ট্যাটাস, পরিবর্তন বা বাতিল সম্পর্কে জানতে
                      আমাদের কল করুন বা ইমেইল করুন।
                    </p>
                  </div>

                  <div className="p-4 bg-[#F4F8F7] rounded-lg border-l-4 border-[#0E4B4B]">
                    <h4 className="font-semibold text-[#0D1414] mb-2">
                      বইয়ের প্রাপ্যতা
                    </h4>
                    <p className="text-sm text-[#0D1414]">
                      নির্দিষ্ট বই পাওয়া যাচ্ছে কিনা জানতে সরাসরি ফোনে যোগাযোগ
                      করুন দ্রুত জানার জন্য।
                    </p>
                  </div>

                  <div className="p-4 bg-[#F4F8F7] rounded-lg border-l-4 border-[#5FA3A3]">
                    <h4 className="font-semibold text-[#0D1414] mb-2">
                      লেখক হওয়ার জন্য
                    </h4>
                    <p className="text-sm text-[#0D1414]">
                      আপনার বই প্রকাশ করতে চাইলে publisher@hilfulfujul.com এ
                      মেইল করুন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#0E4B4B] to-[#086666] text-[#F4F8F7]">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            এখনই বইয়ের জগতে ডুব দিন
          </h2>
          <p className="text-xl mb-8 opacity-90">
            আপনার পরবর্তী প্রিয় বইটি খুঁজে নিন হিলফুল-ফুযুল প্রকাশনীর বিশাল
            সংগ্রহ থেকে
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-[#F4F8F7] text-[#0E4B4B] px-8 py-3 rounded-lg font-semibold hover:bg-[#F4F8F7]/90 transition-all duration-300 hover:scale-105"
            >
              <a href="/kitabghor/books">সকল বই দেখুন</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-[#F4F8F7] text-[#0E4B4B] px-8 py-3 rounded-lg font-semibold hover:bg-[#F4F8F7]/90 transition-all duration-300 hover:scale-105"
            >
              <a href="tel:+88-01842781978">এখনই কল করুন</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
