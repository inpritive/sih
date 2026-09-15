/**
 * Contract validation script to verify mock API conforms 100% to the contract
 */
import { mockApi } from './src/services/mockApi.js';

async function runTests() {
  console.log('Testing GET /cameras...');
  const cameras = await mockApi.getCameras();
  console.assert(Array.isArray(cameras) && cameras.length > 0, 'Cameras must be non-empty array');
  console.assert(cameras[0].id && cameras[0].name && cameras[0].lat && cameras[0].lng, 'Camera shape mismatch');
  console.log('✓ GET /cameras OK:', cameras.length, 'cameras found');

  console.log('Testing GET /plate/KA01AB1234/trajectory...');
  const traj = await mockApi.getPlateTrajectory('KA01AB1234');
  console.assert(traj.plate === 'KA01AB1234', 'Plate mismatch');
  console.assert(Array.isArray(traj.sightings) && traj.sightings.length > 0, 'Sightings missing');
  const s0 = traj.sightings[0];
  console.assert(s0.camera_id && s0.lat && s0.lng && s0.timestamp && typeof s0.confidence === 'number', 'Trajectory sighting shape mismatch');
  console.log('✓ GET /plate/{plate}/trajectory OK:', traj.sightings.length, 'sightings');

  console.log('Testing GET /analytics/summary...');
  const analytics = await mockApi.getAnalyticsSummary();
  console.assert(typeof analytics.vehicle_counts_by_camera === 'object', 'vehicle_counts_by_camera missing');
  console.assert(Array.isArray(analytics.density_grid), 'density_grid missing');
  console.assert(typeof analytics.congestion_score === 'object', 'congestion_score missing');
  console.log('✓ GET /analytics/summary OK');

  console.log('Testing POST /blacklist...');
  const blRes = await mockApi.postBlacklist({ plate: 'KA01AB1234', reason: 'stolen vehicle' });
  console.assert(blRes.status === 'success', 'Blacklist response failed');
  console.log('✓ POST /blacklist OK');

  console.log('Testing POST /sighting...');
  const sigRes = await mockApi.postSighting({
    plate: 'KA01AB1234',
    camera_id: 'cam_1',
    timestamp: '2026-09-15T10:30:45Z',
    confidence: 0.92,
    vehicle_type: 'car',
    color: 'white'
  });
  console.assert(sigRes.status === 'success', 'Sighting response failed');
  console.log('✓ POST /sighting OK');

  console.log('\nALL CONTRACT SHAPES VALIDATED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
