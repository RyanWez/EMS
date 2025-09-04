
'use server';

import { z } from 'zod';
import { getMongoClient } from '@/lib/mongodb';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';

const employeePositions = [
  "Super", "Leader", "Account Department", "Operation", "Security", "Fire Safety", "Cleaner"
] as const;

// Schema for data received by the addEmployeeAction
const addEmployeeServerSchema = z.object({
  name: z.string().min(1),
  nrc: z.string().optional(),
  joinDate: z.string().refine((date) => {
    try {
      format(new Date(date), 'yyyy-MM-dd');
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid date format for Join Date. Expected YYYY-MM-DD." }),
  position: z.enum(employeePositions),
  dob: z.string().refine((date) => {
    try {
      format(new Date(date), 'yyyy-MM-dd');
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid date format for Date of Birth. Expected YYYY-MM-DD." }),
  gender: z.enum(['Male', 'Female']),
  phone: z.string().optional().refine((val) => !val || /^09\d{7,9}$/.test(val), { message: 'Phone number must start with 09 and be 9 to 11 digits long.' }),
  address: z.string().optional(),
});

// Schema for data received by the editEmployeeAction
const editEmployeeServerSchema = addEmployeeServerSchema.extend({
  _id: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid employee ID." }),
});


export interface ClientEmployee {
  _id: string;
  name: string;
  joinDate: string;
  position: "Super" | "Leader" | "Account Department" | "Operation" | "Security" | "Fire Safety" | "Cleaner";
  dob: string;
  gender: "Male" | "Female";
  phone?: string;
  nrc?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddEmployeeActionState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    nrc?: string[];
    joinDate?: string[];
    position?: string[];
    dob?: string[];
    gender?: string[];
    phone?: string[];
    address?: string[];
    general?: string[];
  };
  newEmployee?: ClientEmployee;
}

export interface EditEmployeeActionState {
  success: boolean;
  message: string;
  errors?: {
    _id?: string[];
    name?: string[];
    nrc?: string[];
    joinDate?: string[];
    position?: string[];
    dob?: string[];
    gender?: string[];
    phone?: string[];
    address?: string[];
    general?: string[];
  };
  updatedEmployee?: ClientEmployee;
}


export async function addEmployeeAction(
  data: z.infer<typeof addEmployeeServerSchema>
): Promise<AddEmployeeActionState> {
  const validatedFields = addEmployeeServerSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const client = await getMongoClient();
    const db = client.db();
    const employeesCollection = db.collection('employees');

    const employeeToInsertInDb = {
      ...validatedFields.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await employeesCollection.insertOne(employeeToInsertInDb);

    if (result.insertedId) {
      const plainEmployeeToReturn: ClientEmployee = {
        _id: result.insertedId.toString(),
        name: validatedFields.data.name,
        nrc: validatedFields.data.nrc,
        joinDate: validatedFields.data.joinDate,
        position: validatedFields.data.position,
        dob: validatedFields.data.dob,
        gender: validatedFields.data.gender,
        phone: validatedFields.data.phone,
        address: validatedFields.data.address,
        createdAt: employeeToInsertInDb.createdAt.toISOString(),
        updatedAt: employeeToInsertInDb.updatedAt.toISOString(),
      };

      return {
        success: true,
        message: 'Employee added successfully.',
        newEmployee: plainEmployeeToReturn,
      };
    } else {
      return {
        success: false,
        message: 'Failed to add employee to the database.',
      };
    }
  } catch (error) {
    console.error('Error adding employee to MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return {
      success: false,
      message: `Failed to add employee: ${errorMessage}`,
      errors: { general: [`Database operation failed: ${errorMessage}`] },
    };
  }
}

export async function editEmployeeAction(
  data: z.infer<typeof editEmployeeServerSchema>
): Promise<EditEmployeeActionState> {
  const validatedFields = editEmployeeServerSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input data for update.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { _id, ...employeeDataToUpdate } = validatedFields.data;

  try {
    const client = await getMongoClient();
    const db = client.db();
    const employeesCollection = db.collection('employees');

    const updateResult = await employeesCollection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          ...employeeDataToUpdate,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return {
        success: false,
        message: 'Employee not found.',
      };
    }
    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
        // If nothing was modified but matched, it means data was the same.
        // Fetch the existing document to return it as if it was "updated"
        const existingEmployee = await employeesCollection.findOne({ _id: new ObjectId(_id) });
        if (existingEmployee) {
             const plainEmployeeToReturn: ClientEmployee = {
                _id: existingEmployee._id.toString(),
                name: existingEmployee.name,
                nrc: existingEmployee.nrc,
                joinDate: existingEmployee.joinDate, // Assuming these are already strings
                position: existingEmployee.position,
                dob: existingEmployee.dob, // Assuming these are already strings
                gender: existingEmployee.gender,
                phone: existingEmployee.phone,
                address: existingEmployee.address,
                createdAt: (existingEmployee.createdAt as Date).toISOString(),
                updatedAt: (existingEmployee.updatedAt as Date).toISOString(),
            };
            return {
                success: true,
                message: 'Employee data is already up to date.',
                updatedEmployee: plainEmployeeToReturn,
            };
        }
    }


    // Fetch the updated document to return
    const updatedDoc = await employeesCollection.findOne({ _id: new ObjectId(_id) });
    if (updatedDoc) {
      const plainUpdatedEmployee: ClientEmployee = {
        _id: updatedDoc._id.toString(),
        name: updatedDoc.name,
        nrc: updatedDoc.nrc,
        joinDate: updatedDoc.joinDate, // Assuming these are already strings
        position: updatedDoc.position,
        dob: updatedDoc.dob, // Assuming these are already strings
        gender: updatedDoc.gender,
        phone: updatedDoc.phone,
        address: updatedDoc.address,
        createdAt: (updatedDoc.createdAt as Date).toISOString(),
        updatedAt: (updatedDoc.updatedAt as Date).toISOString(),
      };
      return {
        success: true,
        message: 'Employee updated successfully.',
        updatedEmployee: plainUpdatedEmployee,
      };
    } else {
       return {
        success: false,
        message: 'Failed to retrieve updated employee data.',
      };
    }

  } catch (error) {
    console.error('Error updating employee in MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return {
      success: false,
      message: `Failed to update employee: ${errorMessage}`,
      errors: { general: [`Database operation failed: ${errorMessage}`] },
    };
  }
}
