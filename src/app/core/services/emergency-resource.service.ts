import { inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';
import {
  EmergencyResource,
  EmergencyResourceStats,
} from '../interfaces/emergency-resource-http.interface';

@Injectable({
  providedIn: 'root',
})
export class EmergencyResourceService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'emergency-resources');

  selectedResource = signal<EmergencyResource | undefined>(undefined);

  getAll(): Observable<EmergencyResource[]> {
    return collectionData(this.collectionRef, { idField: 'id' }) as Observable<
      EmergencyResource[]
    >;
  }

  getAllActive(): Observable<EmergencyResource[]> {
    const activeQuery = query(
      this.collectionRef,
      where('status', '==', 'ACTIVE'),
    );
    return collectionData(activeQuery, { idField: 'id' }) as Observable<
      EmergencyResource[]
    >;
  }

  getStats(): Observable<EmergencyResourceStats> {
    // Calculating stats from the client side for now as requested/implied by lack of backend
    return this.getAll().pipe(
      map((resources) => {
        const stats: EmergencyResourceStats = {
          totalResources: resources.length,
          activeEmergencies: resources.filter((r) => r.status === 'ACTIVE')
            .length, // Assuming 'ACTIVE' status
          totalContacts: resources.reduce(
            (acc, r) => acc + (r.contacts?.length || 0),
            0,
          ),
          totalLinks: resources.reduce(
            (acc, r) => acc + (r.links?.length || 0),
            0,
          ),
          totalAccesses: 0, // Not tracking accesses in this simple model yet
        };
        return stats;
      }),
    );
  }

  getById(id: string): Observable<EmergencyResource> {
    const docRef = doc(this.firestore, `emergency-resources/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<EmergencyResource>;
  }

  create(resource: Omit<EmergencyResource, 'id'>): Observable<string> {
    return from(addDoc(this.collectionRef, resource)).pipe(
      map((docRef) => docRef.id),
    );
  }

  update(resource: Partial<EmergencyResource>, id: string): Observable<void> {
    const docRef = doc(this.firestore, `emergency-resources/${id}`);
    return from(updateDoc(docRef, resource));
  }

  delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, `emergency-resources/${id}`);
    return from(deleteDoc(docRef));
  }
}
