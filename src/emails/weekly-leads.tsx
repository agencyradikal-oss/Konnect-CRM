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

export function WeeklyLeadsEmail({
  businessName,
  totalLeads,
  bySource,
  leadsUrl,
}: {
  businessName: string;
  totalLeads: number;
  bySource: { label: string; count: number }[];
  leadsUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{`Resumen semanal: ${totalLeads} leads para ${businessName}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Resumen semanal de leads</Heading>
          <Text style={text}>
            <strong>{businessName}</strong> recibió{" "}
            <strong>{totalLeads}</strong> lead{totalLeads === 1 ? "" : "s"} esta
            semana en Konnect.
          </Text>
          {bySource.length > 0 && (
            <Section>
              {bySource.map((s) => (
                <Text key={s.label} style={{ ...text, margin: "4px 0" }}>
                  · {s.label}: {s.count}
                </Text>
              ))}
            </Section>
          )}
          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Button href={leadsUrl} style={button}>
              Abrir CRM de leads
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
const button = {
  backgroundColor: "#31C9C0",
  color: "#06302d",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  textDecoration: "none",
};
