import { query } from '../config/db.js';

export type UserRole = 'patient' | 'driver' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  role: UserRole;
  blood_type?: string | null;
  allergies?: string | null;
  medical_notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export class UserModel {
  /**
   * Find a user by email address
   */
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query<User>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );
    return res.rows[0] || null;
  }

  /**
   * Find a user by their primary key ID
   */
  static async findById(id: number): Promise<User | null> {
    const res = await query<User>(
      `SELECT id, name, email, phone, role, blood_type, allergies, medical_notes, 
              emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
              created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * List users, optionally filtered by role
   */
  static async findAll(role?: UserRole): Promise<User[]> {
    if (role) {
      const res = await query<User>(
        `SELECT id, name, email, phone, role, blood_type, allergies, medical_notes,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                created_at, updated_at
         FROM users WHERE role = $1 ORDER BY id ASC`,
        [role]
      );
      return res.rows;
    }
    const res = await query<User>(
      `SELECT id, name, email, phone, role, blood_type, allergies, medical_notes,
              emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
              created_at, updated_at
       FROM users ORDER BY id ASC`
    );
    return res.rows;
  }

  /**
   * Create a new user record
   */
  static async create(input: CreateUserInput): Promise<User> {
    const res = await query<User>(
      `INSERT INTO users (
        name, email, password, phone, role,
        blood_type, allergies, medical_notes,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, email, phone, role, blood_type, allergies, medical_notes,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                created_at, updated_at`,
      [
        input.name,
        input.email,
        input.password,
        input.phone || null,
        input.role,
        input.blood_type || 'B+',
        input.allergies || 'None reported',
        input.medical_notes || null,
        input.emergency_contact_name || null,
        input.emergency_contact_phone || null,
        input.emergency_contact_relation || 'Next of Kin',
      ]
    );
    return res.rows[0];
  }

  /**
   * Update a user's profile and medical info
   */
  static async update(id: number, fields: Partial<CreateUserInput>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, email, phone, role, blood_type, allergies, medical_notes,
                 emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                 created_at, updated_at`,
      values
    );

    return res.rows[0] || null;
  }
}
