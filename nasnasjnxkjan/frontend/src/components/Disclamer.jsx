import React from "react";

const Disclaimer = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-transparent overflow-hidden z-50">
      <div className="inline-block animate-marquee-safe px-1 py-2 text-sm font-semibold text-black whitespace-nowrap">
        THIS WEBSITE IS DEVELOPED FOR COLLEGE PROJECT IN AHMEDABAD AND NO HOSPITAL
        DATA IS VERIFIED AND EVERYTHING IS FOR DUMMY PURPOSE : DATA SOURCE :{" "}
        <a
          href="https://apidocs.geoapify.com/playground/places/?categories=healthcare;healthcare.hospital;healthcare.clinic_or_praxis&map=8.3061079580992%2F22.74779417671556%2F72.34130340000002&numberOfResults=22#city"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 hover:text-blue-800 pointer-events-auto"
        >
          GEOAPIFY SITE 
        </a> FOR TESTING
      </div>
    </div>
  );
};

export default Disclaimer;
