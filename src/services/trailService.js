import { trails } from '../data/trails.js'

export const trailService = {
  async list() {
    return trails
  },
  async getById(id) {
    return trails.find((trail) => trail.id === id) ?? null
  },
}