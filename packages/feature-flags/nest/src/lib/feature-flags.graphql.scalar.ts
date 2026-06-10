import { CustomScalar, Scalar } from '@nestjs/graphql';
import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';

function parseLiteralNode(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.NULL:
      return null;
    case Kind.STRING:
    case Kind.ENUM:
      return ast.value;
    case Kind.INT:
      return Number.parseInt(ast.value, 10);
    case Kind.FLOAT:
      return Number.parseFloat(ast.value);
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.LIST:
      return ast.values.map((value) => parseLiteralNode(value));
    case Kind.OBJECT:
      return Object.fromEntries(ast.fields.map((field) => [field.name.value, parseLiteralNode(field.value)]));
    default:
      return null;
  }
}

/**
 * Minimal JSON scalar for feature-flag payloads and dynamic condition values.
 */
export const FeatureFlagsJson = new GraphQLScalarType({
  name: 'FeatureFlagsJson',
  description: 'Arbitrary JSON value',
  parseLiteral(ast: ValueNode): unknown {
    return parseLiteralNode(ast);
  },
  parseValue(value: unknown): unknown {
    return value;
  },
  serialize(value: unknown): unknown {
    return value;
  },
});

@Scalar('FeatureFlagsJson', () => FeatureFlagsJson)
export class FeatureFlagsJsonScalar implements CustomScalar<unknown, unknown> {
  description = 'Arbitrary JSON value';

  parseValue(value: unknown): unknown {
    return value;
  }

  serialize(value: unknown): unknown {
    return value;
  }

  parseLiteral(ast: ValueNode): unknown {
    return parseLiteralNode(ast);
  }
}
