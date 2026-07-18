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

export function BusinessApprovedEmail({
  businessName,
  profileUrl,
}: {
  businessName: string;
  profileUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Tu negocio ya está publicado en Konnect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Felicidades!</Heading>
          <Text style={text}>
            <strong>{businessName}</strong> fue aprobado y ya está publicado en
            el directorio de Konnect.
          </Text>
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button href={profileUrl} style={button}>
              Ver mi perfil público
            </Button>
          </Section>
          <Text style={muted}>
            Cada llamada, WhatsApp o mensaje desde tu perfil se registra como
            lead en tu CRM.
          </Text>
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
const h1 = { color: "#0e1b1a", fontSize: "22px" };
const text = { color: "#0e1b1a", fontSize: "15px", lineHeight: "1.5" };
const muted = { color: "#5c6b69", fontSize: "13px" };
const button = {
  backgroundColor: "#31C9C0",
  color: "#06302d",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  textDecoration: "none",
};
