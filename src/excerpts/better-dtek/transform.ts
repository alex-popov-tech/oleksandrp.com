// https://github.com/alex-popov-tech/better-dtek/blob/7e0aacc5306939116ada7fa79416b7f32a186cf7/src/lib/server/dtek/transform.ts#L39-L56
export function transformBuildingStatus(raw: DtekBuildingStatus): BuildingStatus {
	const result: BuildingStatus = {};

	// Extract schedule group (e.g., "GPV1.2")
	const group = extractScheduleGroup(raw.sub_type_reason);
	if (group) result.group = group;

	// Set outage if API reports active blackout with dates
	if (raw.type && raw.start_date && raw.end_date) {
		result.outage = {
			type: getOutageType(raw.sub_type),
			from: raw.start_date,
			to: raw.end_date,
		};
	}

	return result;
}
