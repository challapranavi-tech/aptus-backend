import { Container } from "@/components/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-padding">
      <Container size="sm">
        <div className="text-center">
          <p className="text-primary" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>404</p>
          <h1 className="mt-2 tracking-tight" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600 }}>
            Page not found
          </h1>
          <p className="mt-4 text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block text-primary hover:underline"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
          >
            Return home
          </Link>
        </div>
      </Container>
    </div>
  );
}
