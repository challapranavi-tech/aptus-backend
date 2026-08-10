export function SupportPanel() {
  return (
    <section className="aptus-dashboard-card aptus-portal-placeholder" aria-label="Support Tickets">
      <div className="aptus-dashboard-section-head">
        <div>
          <h2>Support Tickets</h2>
          <p>
            Need assistance with your order, subscription, licensing, account, or any other
            enquiry? Our support team is here to help.
          </p>
        </div>
      </div>
      <div className="aptus-portal-placeholder__body">
        <p>
          Please contact us by email:{" "}
          <a href="mailto:info@aptusinfotech.com">info@aptusinfotech.com</a>
          {" "}or phone:{" "}
          <a href="tel:+96899418481">+968 9941 8481</a>
        </p>
      </div>
    </section>
  );
}
