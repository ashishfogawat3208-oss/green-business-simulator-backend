// 📊 Dynamic ROI Calculation Engine

export function calculateROIAnalysis(simulations = []) {
  if (!simulations.length) {
    // fallback mock
    return [
      {
        businessType: "Retail Store",
        capex: 250000,
        opex: 15000,
        roi: 18.5,
        paybackMonths: 14,
        monthlySavings: 12000,
      },
    ];
  }

  // Basic formula examples:
  // ROI % = (annual_savings / capex) * 100
  // Payback period = capex / monthly_savings
  return simulations.map((s) => {
    const capex = s.capex || s.initialInvestment || 200000;
    const opex = s.opex || s.operationalCost || 10000;
    const monthlySavings = s.monthlySavings || (s.energy * 5 || 8000); // adjust factor as needed
    const annualSavings = monthlySavings * 12;
    const roi = ((annualSavings - opex * 12) / capex) * 100;
    const paybackMonths = Math.max(1, Math.round(capex / monthlySavings));

    return {
      businessType: s.businessType || "General",
      capex,
      opex,
      roi: Number(roi.toFixed(2)),
      paybackMonths,
      monthlySavings,
    };
  });
}