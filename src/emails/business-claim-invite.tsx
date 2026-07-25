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

export function BusinessClaimInviteEmail({
  businessName,
  claimUrl,
  expiresInDays,
}: {
  businessName: string;
  claimUrl: string;
  expiresInDays: number;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reclama tu negocio en Konnect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Tu ficha ya está en Konnect</Heading>
          <Text style={text}>
            Te invitamos a reclamar <strong>{businessName}</strong> y acceder al
            CRM (leads, contactos y deals) como dueño.
          </Text>
          <Text style={text}>
            Usa el mismo correo de esta invitación para iniciar sesión o crear
            tu cuenta. El enlace vence en {expiresInDays} días.
          </Text>
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button href={claimUrl} style={button}>
              Reclamar mi negocio
            </Button>
          </Section>
          <Text style={muted}>
            Si no esperabas este mensaje, puedes ignorarlo. Solo quien tenga
            acceso a este correo puede reclamar el negocio.
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
