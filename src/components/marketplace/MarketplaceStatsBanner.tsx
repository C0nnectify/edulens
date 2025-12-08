
import React from "react";

const MarketplaceStatsBanner = () => (
  <div className="text-center mt-14">
    <div className="bg-white rounded-xl shadow p-7 max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        One-Stop Marketplace for Students
      </h3>
      <p className="text-gray-600 mb-4">
        Browse, compare, and purchase everything you need for your study abroad journey—right here on our platform.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 mb-1">
            25+
          </div>
          <div className="text-gray-600 text-sm">Service Providers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            100%
          </div>
          <div className="text-gray-600 text-sm">Verified Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            24/7
          </div>
          <div className="text-gray-600 text-sm">Platform Support</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 mb-1">
            All-in-One
          </div>
          <div className="text-gray-600 text-sm">Student Marketplace</div>
        </div>
      </div>
    </div>
  </div>
);
export default MarketplaceStatsBanner;
