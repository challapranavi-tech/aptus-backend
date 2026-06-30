import Image from "next/image";
import { EVENT_ITEMS, NEWS_ITEMS, VIDEO_ITEMS } from "./home-data";

export function EtapHomeNewsSection() {
  return (
    <section className="etap-home-news" data-gsap-section>
      <div className="news-grid">
        <div>
          <h3 className="panel-title">
            <span className="panel-icon panel-icon--news" aria-hidden="true" /> Latest News
          </h3>
          {NEWS_ITEMS.map((item) => (
            <div key={item.title}>
              <p className="list-item-date">
                {item.date} <span>| {item.category}</span>
              </p>
              <p className="list-item-text">
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </p>
            </div>
          ))}
          <a href="https://etap.com/company/news" target="_blank" rel="noopener noreferrer" className="btn-etap-default">
            View all News
          </a>
        </div>

        <div>
          <h3 className="panel-title">
            <span className="panel-icon panel-icon--events" aria-hidden="true" /> Upcoming Events
          </h3>
          {EVENT_ITEMS.map((item) => (
            <div key={item.title}>
              <p className="list-item-date">{item.location}</p>
              <p className="list-item-text">
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </p>
            </div>
          ))}
          <a href="https://etap.com/events/events-schedule" target="_blank" rel="noopener noreferrer" className="btn-etap-default">
            View all Events
          </a>
        </div>

        <div>
          <h3 className="panel-title">
            <span className="panel-icon panel-icon--videos" aria-hidden="true" /> Featured Videos
          </h3>
          {VIDEO_ITEMS.map((item) => (
            <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="video-thumb">
              <Image src={item.image} alt="" width={120} height={68} />
              <h3>{item.title}</h3>
            </a>
          ))}
          <a href="https://etap.com/resources?resourceType=webinar" target="_blank" rel="noopener noreferrer" className="btn-etap-default">
            Browse all Videos
          </a>
        </div>
      </div>
    </section>
  );
}
