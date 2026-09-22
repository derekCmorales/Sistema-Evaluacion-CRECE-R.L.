-- Semilla de catálogos (aplicar cuando Prisma esté cableado).
-- No hay pesos. Umbral y quórum son config, no constantes de código.

INSERT INTO "DecisionFactor" (id, code, label, active, "sortOrder") VALUES
  (gen_random_uuid(), 'PAYMENT_CAPACITY', 'capacidad de pago', true, 10),
  (gen_random_uuid(), 'PAYMENT_HISTORY', 'historial / moral de pago', true, 20),
  (gen_random_uuid(), 'GUARANTEE_COVERAGE', 'cobertura de garantía', true, 30),
  (gen_random_uuid(), 'BUSINESS_AGE', 'antigüedad del negocio', true, 40),
  (gen_random_uuid(), 'INDEBTEDNESS', 'nivel de endeudamiento', true, 50),
  (gen_random_uuid(), 'CREDIT_PURPOSE', 'destino del crédito', true, 60),
  (gen_random_uuid(), 'FILE_INTEGRITY', 'integridad del expediente', true, 70),
  (gen_random_uuid(), 'REFERENCES', 'referencias', true, 80),
  (gen_random_uuid(), 'LIVING_CONDITIONS', 'condiciones de vida', true, 90),
  (gen_random_uuid(), 'ROOTS_RESIDENCE', 'arraigo / residencia', true, 100),
  (gen_random_uuid(), 'INTERNAL_HISTORY', 'historial interno previo', true, 110),
  (gen_random_uuid(), 'NETWORK_BENEFICIARY', 'beneficiario de la red', true, 120)
ON CONFLICT (code) DO NOTHING;

INSERT INTO "ConfigEntry" (key, "valueJson") VALUES
  ('authorization.policy', '{"thresholdGTQ":100000,"bands":[{"kind":"SIGNATURES","maxAmountExclusive":100000,"slots":[{"officeCode":"BRANCH_HEAD","minCount":1},{"officeCode":"DELEGATED_AUTHORIZER","minCount":1}]},{"kind":"QUORUM","minAmountInclusive":100000,"quorumOffice":"COUNCIL_MEMBER","quorumN":3}]}'),
  ('semaphore', '{"waitingDaysRed":7,"checklistIncompletePercent":50,"docExpiryWarningDays":30,"waitingReminderDays":5}'),
  ('rates', '{"creditAnnualRatePercent":18,"fixedTermRates":{"minMonths":6,"maxMonths":36,"annualRatePercent":8},"maxInstallmentToIncomeRatio":0.25,"accountOpeningFeeGTQ":200,"membershipFeeGTQ":25,"provisional":true}')
ON CONFLICT (key) DO NOTHING;
