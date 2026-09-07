// https://github.com/alex-popov-tech/better-dtek/blob/7e0aacc5306939116ada7fa79416b7f32a186cf7/src/lib/server/dtek/transform.ts#L8-L31
/**
 * Extract schedule group ID from sub_type_reason array
 * Looks for pattern like "GPV1.2", "GPV2.1", etc.
 */
export function extractScheduleGroup(subTypeReason: string[] | null): string | undefined {
	if (!subTypeReason?.length) return undefined;
	return subTypeReason.find((r) => /^GPV\d+\.\d+$/.test(r));
}

/**
 * Determine outage type from DTEK sub_type field
 *
 * Known sub_type values:
 * - "Аварійні ремонтні роботи" → emergency (infrastructure failure)
 * - "Стабілізаційне відключення (Згідно графіку погодинних відключень)" → stabilization
 * - "Планові ремонтні роботи" → planned
 * - null or unknown → planned (safe default, no pulsing)
 */
export function getOutageType(subType: string | null): OutageType {
	if (!subType) return 'planned';
	if (subType.includes('Аварійн')) return 'emergency';
	if (subType.includes('Стабілізаційн')) return 'stabilization';
	return 'planned';
}
