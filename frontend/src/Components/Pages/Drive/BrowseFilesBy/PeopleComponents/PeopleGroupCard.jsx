import { PeoplePersonRow } from "../PeopleComponents/PeoplePersonRow";

export const PeopleGroupCard = ({ data }) => {
  return (
    <div className="overflow-hidden">
      {data.map((item, index) => (
        <PeoplePersonRow
          key={index}
          name={item.name}
          tags={item.tags}
          gender={item.gender}
          highlight={item.highlight}
        />
      ))}
    </div>
  );
};