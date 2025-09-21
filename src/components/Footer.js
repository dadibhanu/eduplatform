import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer bg-dark text-light pt-5 pb-4 mt-5">
      <div className="container">
        <div className="row gy-4">
          {/* Company Info */}
          <div className="col-md-4">
            <h5 className="fw-bold mb-3">EduPlatform Pvt Ltd</h5>
            <p className="text-muted small">
              EduPlatform is your one-stop solution for interactive learning
              modules, coding practice, and skill development. We empower
              learners with real-world knowledge.
            </p>
            <p className="mb-1">
              <FaMapMarkerAlt className="me-2" />
              <a
                href="https://maps.google.com/?q=Hyderabad+India"
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none text-light"
              >
                Hyderabad, India
              </a>
            </p>
            <p className="mb-1">
              <FaPhoneAlt className="me-2" />
              <a
                href="tel:+919876543210"
                className="text-decoration-none text-light"
              >
                +91 98765 43210
              </a>
            </p>
            <p>
              <FaEnvelope className="me-2" />
              <a
                href="mailto:support@eduplatform.com"
                className="text-decoration-none text-light"
              >
                support@eduplatform.com
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-2">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled small">
              <li>
                <a href="/" className="text-decoration-none text-light">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-decoration-none text-light">
                  About Us
                </a>
              </li>
              <li>
                <a href="/courses" className="text-decoration-none text-light">
                  Courses
                </a>
              </li>
              <li>
                <a href="/contact" className="text-decoration-none text-light">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-decoration-none text-light">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-decoration-none text-light">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-md-2">
            <h6 className="fw-bold mb-3">Resources</h6>
            <ul className="list-unstyled small">
              <li>
                <a href="/blog" className="text-decoration-none text-light">
                  Blog
                </a>
              </li>
              <li>
                <a href="/faq" className="text-decoration-none text-light">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  className="text-decoration-none text-light"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  className="text-decoration-none text-light"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="col-md-4">
            <h6 className="fw-bold mb-3">Follow Us</h6>
            <div className="d-flex gap-3 fs-5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light"
              >
                <FaTwitter />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light"
              >
                <FaLinkedinIn />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light"
              >
                <FaInstagram />
              </a>
            </div>
            <form className="mt-3">
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Subscribe to newsletter"
                  className="form-control"
                />
                <button className="btn btn-primary">Subscribe</button>
              </div>
            </form>
          </div>
        </div>

        <hr className="mt-4 mb-3 border-secondary" />

        <div className="text-center small text-muted">
          © {new Date().getFullYear()} EduPlatform Pvt Ltd. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
