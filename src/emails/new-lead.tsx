import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function NewLeadEmail({
  businessName,
  leadName,
  message,
  kind,
  leadsUrl,
}: {
  businessName: string;
  leadName: string;
  message: string;
  kind: string;
  leadsUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{`Nuevo lead: ${leadName} — ${message.slice(0, 60)}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nuevo lead en Konnect</Heading>
          <Text style={text}>
            <strong>{leadName}</strong> te envió una solicitud de{" "}
            <strong>{kind}</strong> desde tu perfil de{" "}
            <strong>{businessName}</strong>.
          </Text>
          <Section style={quote}>
            <Text style={{ ...text, margin: 0 }}>{message}</Text>
          </Section>
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button href={leadsUrl} style={button}>
              Ver lead en el CRM
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f0f5f4",
  fontFamily: "system-ui,sans-serif",
};
const container = {
  backgroundColor: "#ffffff",
  margin: "24px auto",
  padding: "32px",
  borderRadius: "12px",
  maxWidth: "520px",
};
const h1 = { color: "#0e1b1a", fontSize: "20px" };
const text = { color: "#0e1b1a", fontSize: "15px", lineHeight: "1.5" };
const quote = {
  margin: "16px 0",
  padding: "12px 16px",
  backgroundColor: "#f4f7f7",
  borderLeft: "4px solid #31C9C0",
};
const button = {
  backgroundColor: "#31C9C0",
  color: "#06302d",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  textDecoration: "none",
};
