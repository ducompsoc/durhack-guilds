import { DataType, Table, Column, Model, HasOne, BelongsTo, ForeignKey } from "sequelize-typescript";
import { AreaModel } from "@/server/common/models";
import Megateam from "@/server/database/megateam";
import Team from "./team";

interface areaIdentifier {
  id: number,
  name: string,
}

@Table
export default class Area extends Model implements AreaModel {
  @Column({
    field: "area_id",
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
    id!: number;

  @ForeignKey(() => Megateam)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
    megateam_id!: number;

  @BelongsTo(() => Megateam)
    megateam!: Megateam;

  @HasOne(() => Team)
    team?: Team;

  @Column({
    field: "area_name",
    type: DataType.STRING,
    allowNull: false,
  })
    name!: string;

  @Column({
    field: "area_room",
    type: DataType.STRING,
    allowNull: false,
  })
    room!: string;
}
