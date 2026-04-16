import { restoreText, scanText } from "./scanner";

describe("scanText PHONE", () => {
  it("detects +7 with spacing", () => {
    const text = "Call +7 (999) 123-45-67 today";
    const { findings, redactedText } = scanText(text);
    expect(findings.some((f) => f.type === "PHONE")).toBe(true);
    expect(redactedText).not.toContain("999");
    expect(redactedText).toMatch(/\[PHONE_\d+\]/);
  });

  it("detects 8 (…) Russian format", () => {
    const text = "8 903 111-22-33";
    const { findings, redactedText } = scanText(text);
    const phone = findings.find((f) => f.type === "PHONE");
    expect(phone?.value).toContain("903");
    expect(redactedText).toMatch(/\[PHONE_\d+\]/);
  });

  it("detects international +country", () => {
    const text = "Dial +15551234567 or wait";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "PHONE" && f.value.includes("5551234567"))).toBe(true);
  });

  it("detects compact +7XXXXXXXXXX", () => {
    const text = "+79991234567";
    const { findings, redactedText } = scanText(text);
    expect(findings).toHaveLength(1);
    expect(redactedText).toBe("[PHONE_1]");
  });
});

describe("scanText EMAIL", () => {
  it("detects simple address", () => {
    const text = "mail me at user@example.com thanks";
    const { findings, redactedText } = scanText(text);
    expect(findings[0]?.type).toBe("EMAIL");
    expect(findings[0]?.value).toBe("user@example.com");
    expect(redactedText).toBe("mail me at [EMAIL_1] thanks");
  });

  it("detects subdomain and plus local-part", () => {
    const text = "a.b+c@mail.sub.example.co.uk";
    const { findings } = scanText(text);
    expect(findings[0]?.type).toBe("EMAIL");
    expect(findings[0]?.value).toBe("a.b+c@mail.sub.example.co.uk");
  });
});

describe("scanText API_KEY", () => {
  it("detects OpenAI-style sk- key", () => {
    const key = "sk-" + "a".repeat(20);
    const text = `token=${key}`;
    const { findings, redactedText } = scanText(text);
    expect(findings.some((f) => f.type === "API_KEY" && f.value === key)).toBe(true);
    expect(redactedText).toBe("token=[API_KEY_1]");
  });

  it("detects Bearer token", () => {
    const text = "Authorization: Bearer abc.def.ghi+jkl/mno=";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "API_KEY" && /Bearer/i.test(f.value))).toBe(true);
  });

  it("detects Google AIza key", () => {
    const key = "AIza" + "0".repeat(35);
    const text = `key=${key}`;
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "API_KEY" && f.value === key)).toBe(true);
  });

  it("detects Slack xoxb bot token", () => {
    const text = "xoxb-1234567890-ABCDEF";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "API_KEY")).toBe(true);
  });
});

describe("scanText CREDIT_CARD", () => {
  it("detects spaced Visa test number passing Luhn", () => {
    const text = "card 4242 4242 4242 4242 end";
    const { findings, redactedText } = scanText(text);
    expect(findings.some((f) => f.type === "CREDIT_CARD")).toBe(true);
    expect(redactedText).not.toContain("4242");
  });

  it("detects continuous PAN passing Luhn", () => {
    const text = "4532015112830366";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "CREDIT_CARD")).toBe(true);
  });

  it("ignores invalid Luhn sequence", () => {
    const text = "4242 4242 4242 4243";
    const { findings } = scanText(text);
    expect(findings.filter((f) => f.type === "CREDIT_CARD")).toHaveLength(0);
  });
});

describe("scanText PASSPORT_RF", () => {
  it("detects spaced series and number", () => {
    const text = "passport 12 34 567890";
    const { findings, redactedText } = scanText(text);
    expect(findings.some((f) => f.type === "PASSPORT_RF")).toBe(true);
    expect(redactedText).toMatch(/\[PASSPORT_RF_\d+\]/);
  });

  it("detects compact 10-digit passport pattern", () => {
    const text = "id:1234567890";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "PASSPORT_RF" && f.value.includes("1234567890"))).toBe(
      true,
    );
  });
});

describe("scanText SNILS", () => {
  it("detects formatted SNILS", () => {
    const text = "snils 112-233-445 95";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "SNILS")).toBe(true);
  });

  it("detects 11 digits with grouping", () => {
    const text = "11223344595";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "SNILS")).toBe(true);
  });
});

describe("scanText JWT", () => {
  const sampleJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U0";

  it("detects standard JWT", () => {
    const text = `auth ${sampleJwt} done`;
    const { findings, redactedText } = scanText(text);
    expect(findings.some((f) => f.type === "JWT" && f.value === sampleJwt)).toBe(true);
    expect(redactedText).not.toContain("eyJ");
  });

  it("uses distinct placeholder for JWT", () => {
    const { findings, redactedText } = scanText(sampleJwt);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.placeholder).toBe("[JWT_1]");
    expect(redactedText).toBe("[JWT_1]");
  });
});

describe("scanText IP_ADDRESS", () => {
  it("detects private IPv4", () => {
    const text = "host 192.168.0.1 port";
    const { findings } = scanText(text);
    expect(findings.some((f) => f.type === "IP_ADDRESS" && f.value === "192.168.0.1")).toBe(true);
  });

  it("detects another IPv4 literal", () => {
    const text = "10.0.0.255";
    const { findings, redactedText } = scanText(text);
    expect(findings[0]?.type).toBe("IP_ADDRESS");
    expect(redactedText).toBe("[IP_ADDRESS_1]");
  });
});

describe("restoreText", () => {
  it("reverses scanText output", () => {
    const original = "ping user@test.com and +79990001122";
    const { findings, redactedText } = scanText(original);
    expect(restoreText(redactedText, findings)).toBe(original);
  });

  it("replaces longer placeholders before shorter (no partial corruption)", () => {
    const findings = [
      { type: "EMAIL" as const, value: "a@b.co", placeholder: "[EMAIL_10]", startIndex: 0 },
      { type: "EMAIL" as const, value: "x@y.z", placeholder: "[EMAIL_1]", startIndex: 20 },
    ];
    const text = "[EMAIL_10] and [EMAIL_1]";
    expect(restoreText(text, findings)).toBe("a@b.co and x@y.z");
  });
});

describe("scanText enabledTypes filter", () => {
  it("only redacts enabled types", () => {
    const text = "a@b.co and +79991112233";
    const { findings, redactedText } = scanText(text, {
      enabledTypes: new Set(["EMAIL"]),
    });
    expect(findings.map((f) => f.type)).toEqual(["EMAIL"]);
    expect(redactedText).toContain("[EMAIL_1]");
    expect(redactedText).toContain("+79991112233");
  });

  it("returns no findings when enabled set is empty", () => {
    const text = "user@example.com";
    const { findings, redactedText } = scanText(text, { enabledTypes: new Set() });
    expect(findings).toHaveLength(0);
    expect(redactedText).toBe(text);
  });
});

describe("placeholders", () => {
  it("increments per type independently", () => {
    const text = "a@b.c x@y.z 192.168.1.1 10.0.0.1";
    const { findings } = scanText(text);
    const emails = findings.filter((f) => f.type === "EMAIL");
    const ips = findings.filter((f) => f.type === "IP_ADDRESS");
    expect(emails.map((e) => e.placeholder)).toEqual(["[EMAIL_1]", "[EMAIL_2]"]);
    expect(ips.map((e) => e.placeholder)).toEqual(["[IP_ADDRESS_1]", "[IP_ADDRESS_2]"]);
  });
});
