import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export function FollowUpEmail({
  businessName,
  body,
  preview,
}: {
  businessName: string;
  body: string;
  preview: string;
}) {
  const paragraphs = body.split(/\n\n+/).filter(Boolean);

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{businessName}</Heading>
          {paragraphs.map((p, i) => (
            <Text key={i} style={text}>
              {p.split("\n").map((line, j, arr) => (
                <span key={j}>
                  {line}
                  {j < arr.length - 1 ? <br /> : null}
                </span>
              ))}
            </Text>
          ))}
          <Text style={muted}>Enviado desde Konnect · {businessName}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f0f5f4",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px 24px",
  borderRadius: "8px",
  maxWidth: "520px",
};

const h1 = {
  color: "#0f3d36",
  fontSize: "22px",
  fontWeight: "700" as const,
  margin: "0 0 16px",
};

const text = {
  color: "#1a1a1a",
  fontSize: "15px",
  lineHeight: "1.55",
  margin: "0 0 14px",
};

const muted = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "24px 0 0",
};
