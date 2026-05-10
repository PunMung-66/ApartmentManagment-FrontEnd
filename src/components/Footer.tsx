export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-200 bg-white py-4 px-4 md:px-6">
      <div className="flex flex-col items-center gap-2 text-sm text-gray-600 text-center">
        <p>
          © {currentYear} Yensabai Apartments. All rights reserved.
        </p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
