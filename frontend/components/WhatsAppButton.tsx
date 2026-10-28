export default function WhatsAppButton() {
  return (
    <a
      href="https://api.whatsapp.com/send?phone=96899418481"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-3 right-3 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_8px_rgba(0,0,0,0.3)] sm:bottom-5 sm:right-5 sm:h-[60px] sm:w-[60px]"
    >
      <img
        src="/whatsapp-icon.svg"
        alt="Chat on WhatsApp"
        className="h-7 w-7 sm:h-[35px] sm:w-[35px]"
        width={35}
        height={35}
      />
    </a>
  );
}
