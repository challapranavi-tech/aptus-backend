import { Container } from "@/components/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-padding">
      <Container size="sm">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="mt-4 text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block text-sm font-medium text-primary hover:underline"
          >
            Return home
          </Link>
        </div>
      </Container>
    </div>
  );
}
