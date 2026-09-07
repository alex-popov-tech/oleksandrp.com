// https://github.com/alex-popov-tech/better-dtek/blob/7e0aacc5306939116ada7fa79416b7f32a186cf7/src/lib/server/dtek/service.ts#L211-L231
/**
 * Service registry for per-region instances
 * Lazily creates service instances on first access
 */
const serviceRegistry = new Map<RegionCode, DtekService>();

/**
 * Get a DtekService instance for a specific region
 * Creates a new instance if one doesn't exist for that region
 *
 * @param region - Region code (e.g., 'kem', 'oem', 'dnem', 'dem')
 * @returns DtekService instance for the specified region
 */
export function getDtekService(region: RegionCode): DtekService {
	let service = serviceRegistry.get(region);
	if (!service) {
		service = createDtekService(region);
		serviceRegistry.set(region, service);
	}
	return service;
}
